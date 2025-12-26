import { Server, Socket } from 'socket.io';
import { MessagesService } from '../services/MessagesService';
import { GameInvitesService } from '../services/GameInvitesService';
import { FriendsService } from '../services/FriendsService';
import { AuthenticatedSocket } from '../middleware/socketAuth';
import { Database } from 'better-sqlite3';

const onlineUsers = new Map<number, string>();

export function setupSocketHandlers(db: Database, io: Server) {
    io.on('connection', (rawSocket: Socket) => {
        const socket = rawSocket as AuthenticatedSocket;
        const userId = socket.data.user.id;

        if (userId) {
            onlineUsers.set(userId, socket.id);
            console.log(`✅ User connected: ${socket.id}`);
            notifyFriendsStatus(db, io, userId, 'online');
            sendOnlineFriendsList(db, io, socket, userId);
        }

        // 🛠️ HELPER: Refactored to not need sender/receiver passed in
        const updateInviteStatus = (inviteId: string, status: string) => {
            const updatedMsg = MessagesService.updateInviteMessage(db, inviteId, status);
            if (updatedMsg) {
                // Determine who needs to know based on the message itself
                const senderSocket = onlineUsers.get(updatedMsg.senderId);
                const receiverSocket = onlineUsers.get(updatedMsg.receiverId);
                
                // If I am the sender, I should see the update
                if (senderSocket) io.to(senderSocket).emit('message_updated', updatedMsg);
                
                // If I am the receiver (and not blocked ideally, but the UI handles hiding), send it
                if (receiverSocket) io.to(receiverSocket).emit('message_updated', updatedMsg);
            }
        };

        socket.on('request_online_friends', () => {
            if (!userId) return;
            sendOnlineFriendsList(db, io, socket, userId);
        });

        socket.on('send_message', async (data: { receiverId: number; content: string }) => {
            try {
                if (!userId) return;
                const message = MessagesService.sendMessage(db, userId, data.receiverId, data.content);
                socket.emit('message_sent', message);
                
                if (!message.isBlocked) {
                    const receiverSocketId = onlineUsers.get(data.receiverId);
                    if (receiverSocketId) io.to(receiverSocketId).emit('new_message', message);
                }
            } catch (error: any) {
                socket.emit('error', { message: error.message });
            }
        });

        // socket.on('mark_message_read', async (data) => { 
        //     try {
        //         if (!userId) return;
        //         MessagesService.markAsRead(data.messageId, userId);
        //         socket.emit('message_marked_read', { messageId: data.messageId });
        //     } catch (error: any) { socket.emit('error', { message: error.message }); }
        // });

        socket.on('mark_all_read', async (data: { senderId: number }) => { 
            try {
                if (!userId) return;
                const result = MessagesService.markAllAsRead(db, userId, data.senderId);
                socket.emit('all_messages_marked_read', result);
            } catch (error: any) { socket.emit('error', { message: error.message }); }
        });

        // socket.on('typing', (data) => { 
        //     if (!userId) return;
        //     if (FriendsService.isBlocked(data.receiverId, userId) || FriendsService.isBlocked(userId, data.receiverId)) return;
        //     const receiverSocketId = onlineUsers.get(data.receiverId);
        //     if (receiverSocketId) io.to(receiverSocketId).emit('user_typing', { userId: userId });
        // });

        // socket.on('stop_typing', (data) => { 
        //     const receiverSocketId = onlineUsers.get(data.receiverId);
        //     if (receiverSocketId) io.to(receiverSocketId).emit('user_stopped_typing', { userId: userId });
        // });

        // 🛠️ FIX: Ghost Invites (Timer + Cancel)
        socket.on('send_game_invite', async (data: { receiverId: number; gameId?: string }) => {
            try {
                if (!userId) return;
                if (!onlineUsers.has(data.receiverId)) throw new Error('User is offline.');

                const { invite, message, isBlocked } = GameInvitesService.sendGameInvite(db, userId, data.receiverId, data.gameId);

                // 1. Emit to Sender (Always)
                socket.emit('game_invite_sent', invite);
                if (message) socket.emit('message_sent', message);

                if (!isBlocked) {
                    // 2a. Real Invite: Emit to Receiver + DB Timer
                    const receiverSocketId = onlineUsers.get(data.receiverId);
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('game_invite_received', invite);
                        if (message) io.to(receiverSocketId).emit('new_message', message);
                    }

                    setTimeout(() => {
                        const currentInvite = GameInvitesService.getInviteById(db, invite.id);
                        if (currentInvite && currentInvite.status === 'pending') {
                            GameInvitesService.expireInvite(db, invite.id);
                            
                            const s1 = onlineUsers.get(invite.senderId);
                            const s2 = onlineUsers.get(invite.receiverId);
                            if (s1) io.to(s1).emit('game_invite_expired', { inviteId: invite.id });
                            if (s2) io.to(s2).emit('game_invite_expired', { inviteId: invite.id });

                            updateInviteStatus(invite.id, 'EXPIRED');
                        }
                    }, 30 * 1000);
                } else {
                    // 2b. 🛠️ FIX: Ghost Timer
                    // Since it's not in DB, we just simulate expiry for the sender
                    setTimeout(() => {
                        const currentInvite = GameInvitesService.getInviteById(db, invite.id);
                        if (currentInvite && currentInvite.status === 'pending') {
                        GameInvitesService.expireInvite(db, invite.id);
                        const s1 = onlineUsers.get(invite.senderId);
                        if (s1) io.to(s1).emit('game_invite_expired', { inviteId: invite.id });
                        updateInviteStatus(invite.id, 'EXPIRED');
                        }
                    }, 30 * 1000);
                }

            } catch (error: any) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('accept_game_invite', async (data: { inviteId: string }) => {
            try {
                if (!userId) return;
                const invite = GameInvitesService.acceptGameInvite(db, data.inviteId, userId);
                
                socket.emit('game_invite_accepted', invite);
                const senderSocketId = onlineUsers.get(invite.senderId);
                if (senderSocketId) io.to(senderSocketId).emit('game_invite_accepted', invite);

                updateInviteStatus(invite.id, 'ACCEPTED');

                notifyFriendsStatus(db ,io, invite.senderId, 'in-game');
                notifyFriendsStatus(db, io, invite.receiverId, 'in-game');
            } catch (error: any) {
                if (error.message.includes('expired')) {
                    socket.emit('game_invite_expired', { inviteId: data.inviteId });
                }
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('decline_game_invite', async (data: { inviteId: string }) => {
            try {
                if (!userId) return;
                GameInvitesService.declineGameInvite(db, data.inviteId, userId);
                
                const invite = GameInvitesService.getInviteById(db, data.inviteId);
                if (invite) {
                    const senderSocketId = onlineUsers.get(invite.senderId);
                    if (senderSocketId) io.to(senderSocketId).emit('game_invite_declined', { inviteId: data.inviteId });
                    updateInviteStatus(invite.id, 'DECLINED');
                }
            } catch (error: any) {
                socket.emit('game_invite_cancelled', { inviteId: data.inviteId });
            }
        });

        socket.on('cancel_game_invite', async (data: { inviteId: string }) => {
            try {
                if (!userId) return;
                // Try to cancel real invite
                const invite = GameInvitesService.cancelGameInvite(db, data.inviteId, userId);
                
                socket.emit('game_invite_cancelled', { inviteId: data.inviteId });
                const receiverSocketId = onlineUsers.get(invite.receiverId);
                if (receiverSocketId) io.to(receiverSocketId).emit('game_invite_cancelled', { inviteId: data.inviteId });

                updateInviteStatus(invite.id, 'CANCELLED');
            } catch (error: any) {
                // 🛠️ FIX: Handle Ghost Cancel
                // If the service threw an error (because ID not in DB), it might be a ghost invite.
                // We still want to update the chat bubble to "CANCELLED".
                socket.emit('game_invite_cancelled', { inviteId: data.inviteId });
                updateInviteStatus(data.inviteId, 'CANCELLED');
            }
        });

        socket.on('game_finished', () => {
            if (!userId) return;
            // Revert status to Online (Green Dot)
            notifyFriendsStatus(db, io, userId, 'online');
        });
    

        socket.on('remove_friend', (data: { friendId: number }) => {
            if (!userId) return;
            
            try {
                // 1. Perform Database Removal (Friendship + Blocks)
                FriendsService.removeFriend(db, userId, data.friendId);

                // 2. Cancel any pending game invites between them
                const cancelledInvites = GameInvitesService.cancelInvitesBetween(db, userId, data.friendId);

                // 3. Notify both users about cancelled games (Closes Waiting Screen!)
                cancelledInvites.forEach(invite => {
                    const s1 = onlineUsers.get(invite.senderId);
                    const s2 = onlineUsers.get(invite.receiverId);
                    if (s1) io.to(s1).emit('game_invite_cancelled', { inviteId: invite.id });
                    if (s2) io.to(s2).emit('game_invite_cancelled', { inviteId: invite.id });
                    
                    // Update Chat Bubble
                    // (We can use a helper or just direct call)
                    const updatedMsg = MessagesService.updateInviteMessage(db, invite.id, 'CANCELLED');
                    if (updatedMsg) {
                        if (s1) io.to(s1).emit('message_updated', updatedMsg);
                        if (s2) io.to(s2).emit('message_updated', updatedMsg);
                    }
                });

                // 4. 🆕 NEW: Notify the OTHER person that they were removed
                // This forces their UI to update instantly
                const friendSocket = onlineUsers.get(data.friendId);
                if (friendSocket) {
                    // "userId" is the person who performed the removal
                    io.to(friendSocket).emit('friend_removed', { friendId: userId });
                }

            } catch (error) {
                console.error('Error removing friend:', error);
                socket.emit('error', { message: 'Failed to remove friend' });
            }
        });
    
        // 1. SEND FRIEND REQUEST
        socket.on('send_friend_request', (data: { friendId: number }) => {
            if (!userId) return;
            try {
                // Call Service
                const result = FriendsService.sendFriendRequest(db, userId, data.friendId);
                
                // Get Sender Details (To show to Receiver)
                const sender = db.prepare('SELECT id, username, Avatar as avatarUrl FROM users WHERE id = ?').get(userId) as any;
                
                // If Auto-Accepted (Both sent requests)
                if (result.status === 'accepted') {
                    const receiverSocketId = onlineUsers.get(data.friendId);
                    const receiver = db.prepare('SELECT id, username, Avatar as avatarUrl FROM users WHERE id = ?').get(data.friendId) as any;

                    // 🛠️ FIX: Inject REAL status
                    const myStatus = onlineUsers.has(userId) ? 'online' : 'offline';
                    const theirStatus = onlineUsers.has(data.friendId) ? 'online' : 'offline';
                    
                    // Notify Sender (Me)
                    socket.emit('new_friend', { ...receiver, status: theirStatus });
                    
                    // Notify Receiver (Them)
                    if (receiverSocketId) io.to(receiverSocketId).emit('new_friend', { ...sender, status: myStatus });
                }
                // If Pending (Normal Request)
                else {
                    const receiverSocketId = onlineUsers.get(data.friendId);
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('friend_request_received', {
                            id: sender.id,
                            username: sender.username,
                            avatarUrl: sender.avatarUrl,
                            friendshipId: result.id
                        });
                    }
                    // Notify Sender (Optional: add to 'sent' list)
                    socket.emit('friend_request_sent_success', { 
                        id: result.id, 
                        user_id: userId, 
                        friend_id: data.friendId, 
                        status: 'pending' 
                    });
                }
            } catch (error: any) { socket.emit('error', { message: error.message }); }
        });

        // 2. ACCEPT FRIEND REQUEST
        socket.on('accept_friend_request', (data: { friendshipId: string; friendId: number }) => {
            if (!userId) return;
            try {
                FriendsService.acceptFriendRequest(db, data.friendshipId);
                
                // Fetch details
                const me = db.prepare('SELECT id, username, Avatar as avatarUrl FROM users WHERE id = ?').get(userId) as any;
                const them = db.prepare('SELECT id, username, Avatar as avatarUrl FROM users WHERE id = ?').get(data.friendId) as any;

                // 🛠️ FIX: Inject REAL status
                const myStatus = onlineUsers.has(userId) ? 'online' : 'offline';
                const theirStatus = onlineUsers.has(data.friendId) ? 'online' : 'offline';
            
                // Notify Me (Add to Friend List)
                socket.emit('new_friend', { ...them, status: theirStatus });

                // Notify Them (Add Me to Friend List)
                const themSocket = onlineUsers.get(data.friendId);
                if (themSocket) io.to(themSocket).emit('new_friend', { ...me, status: myStatus });

            } catch (error: any) { socket.emit('error', { message: error.message }); }
        });

        // 3. DECLINE FRIEND REQUEST
        socket.on('decline_friend_request', (data: { friendshipId: string }) => {
            if (!userId) return;
            try {
                const result = FriendsService.declineFriendRequest(db, data.friendshipId);
                //  Remove it from my list
                socket.emit('friend_request_removed', { friendshipId: data.friendshipId });
            
                // Notify the OTHER person that their request was declined
                const otherPersonId = (result.userId === userId) ? result.friendId : result.userId;
                const themSocket = onlineUsers.get(otherPersonId);
                if (themSocket) {
                    // This removes it from THEIR list immediately
                    io.to(themSocket).emit('friend_request_removed', { friendshipId: data.friendshipId });
                }
            } catch (error: any) { socket.emit('error', { message: error.message }); }
        });

        // 4. BLOCK USER
        socket.on('block_user', (data: { blockedUserId: number }) => {
            if (!userId) return;
            try {
                FriendsService.blockUser(db, userId, data.blockedUserId);
                
                // Fetch blocked user details for my list
                const blockedUser = db.prepare('SELECT id, username, Avatar as avatarUrl FROM users WHERE id = ?').get(data.blockedUserId) as any;
                
                socket.emit('friend_blocked', blockedUser);
                
                // (Optional) We could notify the blocked user they were "removed" if they were friends, 
                // but usually we rely on the next refresh for them (Ghosting).
                
            } catch (error: any) { socket.emit('error', { message: error.message }); }
        });

        // 5. UNBLOCK USER
        socket.on('unblock_user', (data: { blockedUserId: number }) => {
            if (!userId) return;
            try {
                FriendsService.unblockUser(db, userId, data.blockedUserId);
                socket.emit('friend_unblocked', { userId: data.blockedUserId });
                
                // Note: If they were friends before, they reappear automatically on next fetch.
                // For real-time restore, we'd need to check if friendship exists and emit 'new_friend'.
                const friendship = db.prepare(`SELECT * FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?) AND status = 'accepted'`).get(userId, data.blockedUserId, data.blockedUserId, userId);
                
                if (friendship) {
                    const friend = db.prepare('SELECT id, username, Avatar as avatarUrl FROM users WHERE id = ?').get(data.blockedUserId) as any;
                    const friendStatus = onlineUsers.has(data.blockedUserId) ? 'online' : 'offline';
                    socket.emit('new_friend', { ...friend, status: friendStatus });
                }

            } catch (error: any) { socket.emit('error', { message: error.message }); }
        });

        socket.on('disconnect', () => {
            if (userId) {
                onlineUsers.delete(userId);
                notifyFriendsStatus(db, io, userId, 'offline');

                const cancelledInvites = GameInvitesService.cancelInvitesFromSender(db, userId);
                cancelledInvites.forEach(invite => {
                    const receiverSocket = onlineUsers.get(invite.receiverId);
                    if (receiverSocket) {
                        io.to(receiverSocket).emit('game_invite_cancelled', { inviteId: invite.id });
                    }
                    updateInviteStatus(invite.id, 'CANCELLED');
                });
            }
        });
    });
}

function notifyFriendsStatus(db: Database, io: Server, userId: number, status: 'online' | 'offline'| 'in-game') {
    try {
        const friends = FriendsService.getFriendsToNotify(db, userId);
        friends.forEach((friend: any) => {
            // if (FriendsService.isBlocked(userId, friend.id)) return;
            const friendSocketId = onlineUsers.get(friend.id);
            if (friendSocketId) io.to(friendSocketId).emit('friend_status_change', { userId, status });
        });
    } catch (error) {}
}

function sendOnlineFriendsList(db: Database, io: Server, socket: Socket, userId: number) {
    try {
        const friends = FriendsService.getFriends(db, userId);
        const blocked = FriendsService.getBlockedUsers(db, userId);
        const allContacts = [...friends, ...blocked];
        const onlineFriends = allContacts.filter((allContacts: any) => {
            const isOnline = onlineUsers.has(allContacts.id);
            if (!isOnline) return false;
            return true;
        });
        socket.emit('online_friends', onlineFriends);
    } catch (error) {
        console.error('Error sending online friends list:', error);
    }
}

export function isUserOnline(userId: number): boolean {
    return onlineUsers.has(userId);
}

export function getOnlineUsersCount(): number {
    return onlineUsers.size;
}