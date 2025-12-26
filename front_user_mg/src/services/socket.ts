import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../store/useChatStore';
import type { Message, GameInvite, Friend } from '../types';

// 🛠️ FIX: Dynamic Socket URL
// const getSocketUrl = () => {
//     // if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
    
//     const { protocol, hostname } = window.location;
//     return `${protocol}//${hostname}:3001`;
// };

class SocketService {
    socket: Socket | null = null;

    connect() {
        if (this.socket?.connected) return;

        const token = localStorage.getItem('authToken');
        if (!token) return;

        // 🛠️ FIX: Dynamic URL here too
        const { protocol, hostname } = window.location;
        const SOCKET_URL = `${protocol}//${hostname}:3000`;

        this.socket = io(SOCKET_URL, { 
            auth: { token }, 
            transports: ['websocket'], 
            withCredentials: true
        });

        this.setupListeners();
    }

    private setupListeners() {
        if (!this.socket) return;

        // Helper: We need userId for 'addMessage', but we are not in a React Component.
        // We decode it directly from the token we just used to connect.
        const token = localStorage.getItem('authToken');
        let userId: number | any; 
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                userId = payload.sub || payload.id;
            } catch (e) {
                console.error("SocketService: Failed to parse user ID from token");
            }
        }

        this.socket.on('connect', () => {
            console.log("✅ Socket connected");
        });
        // this.userId = userId;

        // this.socket = io(getSocketUrl(), { auth: { userId }, transports: ['websocket'] });


        this.socket.on('new_message', (msg: Message) => useChatStore.getState().addMessage(msg, userId));
        this.socket.on('message_sent', (msg: Message) => useChatStore.getState().addMessage(msg, userId));
        this.socket.on('message_updated', (msg: Message) => useChatStore.getState().updateMessage(msg));

        this.socket.on('friend_status_change', (data) => useChatStore.getState().setUserStatus(data.userId, data.status));
        this.socket.on('online_friends', (friends) => useChatStore.getState().setOnlineUsers(friends.map((f:Friend) => f.id)));

        this.socket.on('game_invite_received', (invite: GameInvite) => useChatStore.getState().setIncomingInvite(invite));
        this.socket.on('game_invite_sent', (invite: GameInvite) => useChatStore.getState().setOutgoingInvite(invite));
        
        this.socket.on('game_invite_accepted', (invite: GameInvite) => {
            alert(`GAME STARTING! Game #${invite.gameId || invite.id}`);
            useChatStore.getState().setIncomingInvite(null);
            useChatStore.getState().setOutgoingInvite(null);
        });

        this.socket.on('game_invite_declined', () => {
            // alert("Game invite was declined.");
            useChatStore.getState().setOutgoingInvite(null);
        });

        this.socket.on('game_invite_cancelled', (data: { inviteId: string }) => {
            const { incomingInvite, outgoingInvite, setIncomingInvite, setOutgoingInvite } = useChatStore.getState();
            if (incomingInvite?.id === data.inviteId) setIncomingInvite(null);
            if (outgoingInvite?.id === data.inviteId) setOutgoingInvite(null);
        });

        // 🛠️ NEW: Handle Expiry
        this.socket.on('game_invite_expired', (data: { inviteId: string }) => {
            const { incomingInvite, outgoingInvite, setIncomingInvite, setOutgoingInvite } = useChatStore.getState();
            if (incomingInvite?.id === data.inviteId) {
                setIncomingInvite(null);
                // alert("Game invite expired.");
            }
            if (outgoingInvite?.id === data.inviteId) {
                setOutgoingInvite(null);
            }
        });
        this.socket.on('error', (err: {message: string}) => alert(err.message));
        
        // --- FRIEND EVENTS ---
        
        // 1. Received Request -> Add to Pending
        this.socket.on('friend_request_received', (req) => {
            useChatStore.getState().addPendingRequest(req);
            // Optional: Show toast notification?
        });

        // 🛠️ FIX: Handle "Sent Success" to update UI instantly
        this.socket.on('friend_request_sent_success', (req) => {
            useChatStore.getState().addSentRequest(req);
        });

        // 2. New Friend (Accepted or Auto-Accepted) -> Add to Friends
        this.socket.on('new_friend', (friend) => {
            useChatStore.getState().addFriend(friend);
            // Also remove from pending requests if it was there
            useChatStore.getState().removePendingRequest(friend.friendshipId); 
            useChatStore.getState().setUserStatus(friend.id, friend.status);
        });

        // 3. Request Removed (Declined) -> Remove from Pending
        this.socket.on('friend_request_removed', (data) => {
            useChatStore.getState().removePendingRequest(data.friendshipId);
        });

        // 4. Blocked -> Add to Blocked List
        this.socket.on('friend_blocked', (user) => {
            useChatStore.getState().addBlockedUser(user);
        });

        // 5. Unblocked -> Remove from Blocked List
        this.socket.on('friend_unblocked', (data) => {
            useChatStore.getState().removeBlockedUser(data.userId);
        });

        // 6. 🆕 NEW: Friend Removed (Passive)
        // This fires when SOMEONE ELSE removes YOU.
        this.socket.on('friend_removed', (data: { friendId: number }) => {
            useChatStore.getState().removeFriendState(data.friendId);
            
            // Optional: Close chat if open with them
            const currentSelected = useChatStore.getState().selectedFriendId;
            if (currentSelected === data.friendId) {
                useChatStore.setState({ selectedFriendId: null });
            }
        });

    }

    removeFriend(friendId: number) { this.socket?.emit('remove_friend', { friendId }); }
    disconnect() { this.socket?.disconnect(); this.socket = null; }
    sendMessage(receiverId: number, content: string) { this.socket?.emit('send_message', { receiverId, content }); }
    sendGameInvite(receiverId: number) { this.socket?.emit('send_game_invite', { receiverId }); }
    acceptGameInvite(inviteId: string) { this.socket?.emit('accept_game_invite', { inviteId }); }
    declineGameInvite(inviteId: string) { this.socket?.emit('decline_game_invite', { inviteId }); }
    cancelGameInvite(inviteId: string) { this.socket?.emit('cancel_game_invite', { inviteId }); }
    requestOnlineFriends() { this.socket?.emit('request_online_friends'); }

    sendFriendRequest(friendId: number) { this.socket?.emit('send_friend_request', { friendId }); }
    acceptFriendRequest(friendshipId: string, friendId: number) { this.socket?.emit('accept_friend_request', { friendshipId, friendId }); }
    declineFriendRequest(friendshipId: string) { this.socket?.emit('decline_friend_request', { friendshipId }); }
    blockUser(blockedUserId: number) { this.socket?.emit('block_user', { blockedUserId }); }
    unblockUser(blockedUserId: number) { this.socket?.emit('unblock_user', { blockedUserId }); }
    markAllRead(senderId: number) { this.socket?.emit('mark_all_read', { senderId }); }
}

export const socketService = new SocketService();