export interface User {
    id: number;
    username: string;
    email: string;
    avatarUrl?: string;
    status?: 'online' | 'offline' | 'in-game';
}

export interface Message {
    id: string;
    senderId: number;
    receiverId: number;
    content: string;
    read: boolean;
    isInvite?: boolean;
    createdAt: string; // JSON dates are strings
}

export interface GameInvite {
    id: string;
    senderId: number;
    receiverId: number;
    gameId?: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    createdAt: string;
    expiresAt: string;
    senderUsername?: string;
    senderAvatar?: string;
}

export interface Friend extends User {
    // Extends User to include username/avatar directly
    friendshipId?: string;
}