"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchmakingService = void 0;
class MatchmakingService {
    queue = [];
    enqueue(socket, userId, username) {
        // Check if user already in queue
        const existingIndex = this.queue.findIndex(p => p.userId === userId);
        if (existingIndex !== -1) {
            // Remove old entry
            this.queue.splice(existingIndex, 1);
        }
        // Add to queue
        const ticket = {
            socket,
            userId,
            username,
            joinedAt: Date.now()
        };
        // If queue has at least one player waiting, match them
        if (this.queue.length > 0) {
            const opponent = this.queue.shift();
            console.log(`✅ Match found: ${username} (${userId}) vs ${opponent.username} (${opponent.userId})`);
            return {
                player1: opponent,
                player2: ticket
            };
        }
        // Add to queue and wait
        this.queue.push(ticket);
        console.log(`⏳ ${username} (${userId}) added to queue. Queue size: ${this.queue.length}`);
        return null;
    }
    dequeue(userId) {
        const index = this.queue.findIndex(p => p.userId === userId);
        if (index !== -1) {
            this.queue.splice(index, 1);
            console.log(`❌ ${userId} removed from queue. Queue size: ${this.queue.length}`);
            return true;
        }
        return false;
    }
    pendingCount() {
        return this.queue.length;
    }
    isInQueue(userId) {
        return this.queue.some(p => p.userId === userId);
    }
}
exports.MatchmakingService = MatchmakingService;
