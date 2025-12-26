import { create } from 'zustand';
import type { Message, Friend, GameInvite } from '../types';

interface PendingRequest { id: number; username: string; avatarUrl?: string; friendshipId: string; }
type UserStatus = 'online' | 'offline' | 'in-game';

interface ChatState {
    friends: Friend[];
    blockedUsers: Friend[];
    pendingRequests: PendingRequest[];
    sentRequests: any[];
    userStatuses: Record<number, UserStatus>;

    messages: Record<number, Message[]>;
    selectedFriendId: number | null;
    unreadCounts: Record<number, number>;
    incomingInvite: GameInvite | null;
    outgoingInvite: GameInvite | null;

    setFriends: (friends: Friend[]) => void;
    setBlockedUsers: (users: Friend[]) => void;
    setPendingRequests: (reqs: PendingRequest[]) => void;
    setSentRequests: (reqs: any[]) => void;
    setUserStatus: (userId: number, status: UserStatus) => void;
    setOnlineUsers: (userIds: number[]) => void;
    setUnreadCounts: (data: any[]) => void;

    addFriend: (friend: Friend) => void;
    removeFriendState: (friendId: number) => void; // Renamed to avoid confusion with API action
    addPendingRequest: (req: PendingRequest) => void;
    removePendingRequest: (friendshipId: string) => void;
    addSentRequest: (req: any) => void; // 🛠️ NEW
    addBlockedUser: (user: Friend) => void;
    removeBlockedUser: (userId: number) => void;

    selectFriend: (friendId: number) => void;
    
    // 🛠️ UPDATED: addMessage now needs currentUserId for correct logic
    addMessage: (message: Message, currentUserId: number) => void;
    
    // 🛠️ NEW: updateMessage for status changes
    updateMessage: (message: Message) => void;

    setMessages: (friendId: number, messages: Message[]) => void;
    setIncomingInvite: (invite: GameInvite | null) => void;
    setOutgoingInvite: (invite: GameInvite | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    friends: [], blockedUsers: [], pendingRequests: [], sentRequests: [], userStatuses: {},
    messages: {}, selectedFriendId: null, unreadCounts: {},
    incomingInvite: null, outgoingInvite: null,

    setFriends: (friends) => set({ friends }),
    setBlockedUsers: (users) => set({ blockedUsers: users }),
    setPendingRequests: (reqs) => set({ pendingRequests: reqs }),
    setSentRequests: (reqs) => set({ sentRequests: reqs }),
    setUserStatus: (userId, status) => set((state) => ({ userStatuses: { ...state.userStatuses, [userId]: status } })),
    setOnlineUsers: (userIds) => set(() => {
        const newStatuses: Record<number, UserStatus> = {};
        userIds.forEach(id => { newStatuses[id] = 'online'; });
        return { userStatuses: newStatuses };
    }),

    setUnreadCounts: (data) => set((state) => {
        const newCounts: Record<number, number> = {};
        data.forEach((item: any) => {
            // Backend returns { senderId, unreadCount, ... }
            if (item.senderId === state.selectedFriendId) {
                newCounts[item.senderId] = 0;
            } else {
                newCounts[item.senderId] = item.unreadCount;
            }
        });
        return { unreadCounts: newCounts };
    }),


// 🛠️ NEW: Granular Updates
    addFriend: (friend) => set((state) => ({ 
        friends: [friend, ...state.friends],
        // Remove from pending/sent if it was there
        pendingRequests: state.pendingRequests.filter(req => req.username !== friend.username),
        sentRequests: state.sentRequests.filter(req => req.friend_id !== friend.id)
    })),

    removeFriendState: (friendId) => set((state) => ({ 
        friends: state.friends.filter(f => f.id !== friendId),
        // 2. ✅ ADD THIS: Remove from Blocked Users List as well
        blockedUsers: state.blockedUsers.filter((u) => u.id !== friendId),
    })),

    addPendingRequest: (req) => set((state) => ({ 
        pendingRequests: [req, ...state.pendingRequests] 
    })),

    removePendingRequest: (friendshipId) => set((state) => ({ 
        pendingRequests: state.pendingRequests.filter(req => req.friendshipId !== friendshipId),
        sentRequests: state.sentRequests.filter(req => req.id !== friendshipId)
    })),

    // 🛠️ NEW ACTION
    addSentRequest: (req) => set((state) => ({
        sentRequests: [req, ...state.sentRequests]
    })),

    addBlockedUser: (user) => set((state) => ({ 
        blockedUsers: [user, ...state.blockedUsers],
        friends: state.friends.filter(f => f.id !== user.id) // Ensure removed from friends
    })),

    removeBlockedUser: (userId) => set((state) => ({ 
        blockedUsers: state.blockedUsers.filter(u => u.id !== userId) 
    })),

    selectFriend: (friendId) => {
        set({ selectedFriendId: friendId });
        set((state) => ({ unreadCounts: { ...state.unreadCounts, [friendId]: 0 } }));
    },

    // 🛠️ FIXED: Unread logic
    addMessage: (message, currentUserId) => set((state) => {
        const otherId = message.senderId === currentUserId ? message.receiverId : message.senderId;
        // Unread if I didn't send it AND I'm not looking at it
        const isUnread = (message.senderId !== currentUserId) && (message.senderId !== state.selectedFriendId);
        
        return {
            messages: { ...state.messages, [otherId]: [...(state.messages[otherId] || []), message] },
            unreadCounts: isUnread ? { ...state.unreadCounts, [message.senderId]: (state.unreadCounts[message.senderId] || 0) + 1 } : state.unreadCounts
        };
    }),

    // 🛠️ NEW: Update existing message (for invite status)
    updateMessage: (updatedMsg) => set((state) => {
        // Find which conversation this message belongs to
        // Since we don't know currentUserId here easily, search in both possible keys?
        // Easier: we iterate keys or assume caller knows. 
        // Robust way: Update in ALL conversations (since ID is unique)
        const newMessages = { ...state.messages };
        
        // Helper to update array
        const updateArray = (list: Message[]) => list.map(m => m.id === updatedMsg.id ? updatedMsg : m);

        // Try updating both sides just in case
        if (newMessages[updatedMsg.senderId]) newMessages[updatedMsg.senderId] = updateArray(newMessages[updatedMsg.senderId]);
        if (newMessages[updatedMsg.receiverId]) newMessages[updatedMsg.receiverId] = updateArray(newMessages[updatedMsg.receiverId]);
        
        return { messages: newMessages };
    }),

    setMessages: (friendId, history) => set((state) => ({ messages: { ...state.messages, [friendId]: history } })),
    setIncomingInvite: (invite) => set({ incomingInvite: invite }),
    setOutgoingInvite: (invite) => set({ outgoingInvite: invite }),


}));