// Matchmaking Queue System
import { Socket } from 'socket.io';

export interface QueuedPlayer {
    socket: Socket;
    username: string;
    userId: number;
    queuedAt: number;
}

export class MatchmakingService {
    private queue: QueuedPlayer[] = [];

    enqueue(socket: Socket, username: string, userId: number): QueuedPlayer[] | null {
        // Check if already in queue
        const existing = this.queue.find(p => p.socket.id === socket.id);
        if (existing) return null;

        // Add to queue
        const player: QueuedPlayer = {
            socket,
            username,
            userId,
            queuedAt: Date.now()
        };
        this.queue.push(player);

        // Try to match
        if (this.queue.length >= 2) {
            const p1 = this.queue.shift()!;
            const p2 = this.queue.shift()!;
            return [p1, p2];
        }

        return null;
    }

    remove(socketId: string): boolean {
        const index = this.queue.findIndex(p => p.socket.id === socketId);
        if (index !== -1) {
            this.queue.splice(index, 1);
            return true;
        }
        return false;
    }

    pendingCount(): number {
        return this.queue.length;
    }

    getPosition(socketId: string): number {
        return this.queue.findIndex(p => p.socket.id === socketId) + 1;
    }

    clear() {
        this.queue = [];
    }
}
