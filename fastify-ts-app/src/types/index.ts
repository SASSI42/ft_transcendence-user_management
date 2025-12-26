// Type definitions for various entities in the chat application

export type User = {
    id: number;
    username: string;
    email: string;
    avatarUrl?: string;
};

export type Friend = {
    id: number;
    userId: number;
    friendId: number;
};

export type Friendship = {
    id: string;
    userId: number;
    friendId: number;
    createdAt: Date;
};

export type Message = {
    id: string;
    senderId: number;
    receiverId: number;
    content: string;
    timestamp: Date;
};

export type GameInvite = {
    id: string;
    senderId: number;
    receiverId: number;
    gameId: string;
    timestamp: Date;
};

export type SocketEvent = {
    event: string;
    data: any;
};