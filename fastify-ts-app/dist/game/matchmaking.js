"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchmakingService = void 0;
class MatchmakingService {
    queue = [];
    enqueue(socket, username, userId) {
        // Check if already in queue
        const existing = this.queue.find(p => p.socket.id === socket.id);
        if (existing)
            return null;
        // Add to queue
        const player = {
            socket,
            username,
            userId,
            queuedAt: Date.now()
        };
        this.queue.push(player);
        // Try to match
        if (this.queue.length >= 2) {
            const p1 = this.queue.shift();
            const p2 = this.queue.shift();
            return [p1, p2];
        }
        return null;
    }
    remove(socketId) {
        const index = this.queue.findIndex(p => p.socket.id === socketId);
        if (index !== -1) {
            this.queue.splice(index, 1);
            return true;
        }
        return false;
    }
    pendingCount() {
        return this.queue.length;
    }
    getPosition(socketId) {
        return this.queue.findIndex(p => p.socket.id === socketId) + 1;
    }
    clear() {
        this.queue = [];
    }
}
exports.MatchmakingService = MatchmakingService;
