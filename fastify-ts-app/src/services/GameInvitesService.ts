
import { v4 as uuidv4 } from 'uuid';
import { FriendsService } from './FriendsService';
import { MessagesService } from './MessagesService';
import { Database } from 'better-sqlite3';

interface GameInviteRow {
    id: string;
    sender_id: string;
    receiver_id: string;
    game_id: string | null;
    status: string;
    created_at: string;
    expires_at: string;
}

export class GameInvitesService {
    static sendGameInvite(db: Database, senderId: number, receiverId: number, gameId?: string) {
        if (!FriendsService.areFriends(db, senderId, receiverId)) throw new Error('Can only send game invites to friends');
        if (FriendsService.isBlocked(db, receiverId, senderId)) throw new Error('You have blocked this user');

        const existing = db.prepare(`SELECT * FROM game_invites WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'`).get(senderId, receiverId);
        if (existing) throw new Error('A pending game invite already exists');

        const id = uuidv4();
        
        // 🛠️ FIX: Use SQLite Native Time (30 seconds)
        // This ensures 'expires_at' matches the DB format for valid comparison
        db.prepare(`
            INSERT INTO game_invites (id, sender_id, receiver_id, game_id, expires_at) 
            VALUES (?, ?, ?, ?, datetime('now', '+30 seconds'))
        `).run(id, senderId, receiverId, gameId || null);

        let inviteMessage = null;
        try {
            // 🛠️ FIX: Pass 'true' as the 4th argument (isInvite)
            inviteMessage = MessagesService.sendMessage(db, senderId, receiverId, `INVITE::${id}`, true);
        } catch (err) {
            console.error("Failed to create invite message", err);
        }

        // Fetch row to get the exact string SQLite stored
        const row = db.prepare('SELECT * FROM game_invites WHERE id = ?').get(id) as GameInviteRow;

        return { 
            invite: this.mapRow(row),
            message: inviteMessage,
            isBlocked: inviteMessage?.isBlocked || false
        };
    }

    static acceptGameInvite(db: Database, inviteId: string, userId: number) {
        const invite = db.prepare(`SELECT * FROM game_invites WHERE id = ? AND receiver_id = ? AND status = 'pending'`).get(inviteId, userId) as GameInviteRow | undefined;
        
        if (!invite) throw new Error('Game invite not found or expired');
        
        // 🛠️ FIX: Strict date parsing for comparison
        // Replaces space with T to make it valid JS ISO format
        const expiryDate = new Date(invite.expires_at.replace(' ', 'T') + 'Z');
        if (expiryDate < new Date()) {
            this.expireInvite(db, inviteId);
            throw new Error('Game invite has expired');
        }

        db.prepare(`UPDATE game_invites SET status = 'accepted' WHERE id = ?`).run(inviteId);
        return { ...this.mapRow(invite), status: 'accepted' };
    }

    static declineGameInvite(db: Database, inviteId: string, userId: number) {
        const res = db.prepare(`UPDATE game_invites SET status = 'declined' WHERE id = ? AND receiver_id = ? AND status = 'pending'`).run(inviteId, userId);
        if (res.changes === 0) throw new Error('Game invite not found');
        return { success: true };
    }

    static cancelGameInvite(db: Database, inviteId: string, senderId: number) {
        const invite = db.prepare(`SELECT * FROM game_invites WHERE id = ? AND sender_id = ? AND status = 'pending'`).get(inviteId, senderId) as GameInviteRow | undefined;
        
        if (!invite) throw new Error('Game invite not found');

        db.prepare(`DELETE FROM game_invites WHERE id = ? AND sender_id = ? AND status = 'pending'`).run(inviteId, senderId);
        
        return { ...this.mapRow(invite), status: 'cancelled' };
    }

    static cancelInvitesFromSender(db: Database, senderId: number) {
        const invites = db.prepare(`SELECT * FROM game_invites WHERE sender_id = ? AND status = 'pending'`).all(senderId) as GameInviteRow[];
        if (invites.length > 0) {
            db.prepare(`DELETE FROM game_invites WHERE sender_id = ? AND status = 'pending'`).run(senderId);
        }
        return invites.map(row => this.mapRow(row));
    }

    // 🛠️ NEW: Cancel all pending invites between two users (Bi-directional)
    static cancelInvitesBetween(db: Database, userId1: number, userId2: number) {
        // 1. Find them first (so we can return them for notification)
        const invites = db.prepare(`
            SELECT * FROM game_invites 
            WHERE status = 'pending' 
            AND (
                (sender_id = ? AND receiver_id = ?) OR 
                (sender_id = ? AND receiver_id = ?)
            )
        `).all(userId1, userId2, userId2, userId1) as any[];

        if (invites.length === 0) return [];

        // 2. Delete them
        db.prepare(`
            DELETE FROM game_invites 
            WHERE status = 'pending' 
            AND (
                (sender_id = ? AND receiver_id = ?) OR 
                (sender_id = ? AND receiver_id = ?)
            )
        `).run(userId1, userId2, userId2, userId1);

        return invites.map(row => this.mapRow(row));
    }
    static getPendingInvites(db: Database, userId: number) {
        // 🛠️ FIX: Filter out invites from people I have blocked OR who blocked me (though invites from blockers shouldn't exist)
        // Actually, we specifically want to filter out invites where the *Sender* is blocked by *Receiver* (userId)
        // Wait, 'blocked_users' table: blocker_id = userId (Me), blocked_id = sender
        
        const stmt = db.prepare(`
            SELECT gi.*, u.username as sender_username, u.Avatar as sender_avatar
            FROM game_invites gi JOIN users u ON u.id = gi.sender_id
            WHERE gi.receiver_id = ? 
            AND gi.status = 'pending' 
            AND gi.expires_at > datetime('now')
            
            -- 🛡️ SECURITY: Exclude if I (receiver) blocked the sender
            AND NOT EXISTS (
                SELECT 1 FROM blocked_users b 
                WHERE b.blocker_id = ? AND b.blocked_id = gi.sender_id
            )
            ORDER BY gi.created_at DESC
        `);
        return stmt.all(userId, userId).map((row: any) => this.mapRow(row));
    }

    static getSentInvites(db: Database, userId: number) {
        const stmt = db.prepare(`
            SELECT gi.*, u.username as receiver_username, u.Avatar as receiver_avatar
            FROM game_invites gi JOIN users u ON u.id = gi.receiver_id
            WHERE gi.sender_id = ? AND gi.status = 'pending'
            ORDER BY gi.created_at DESC
        `);
        return stmt.all(userId).map((row: any) => this.mapRow(row));
    }

    static getInviteById(db: Database, inviteId: string) {
        const row = db.prepare(`SELECT * FROM game_invites WHERE id = ?`).get(inviteId) as any;
        if (!row) return undefined;
        return this.mapRow(row);
    }

    static expireInvite(db: Database, inviteId: string) {
        db.prepare(`UPDATE game_invites SET status = 'expired' WHERE id = ?`).run(inviteId);
        return { success: true };
    }

    static cleanupExpiredInvites(db: Database) {
        // 🛠️ FIX: Use SQLite native datetime for comparison
        const res = db.prepare(`UPDATE game_invites SET status = 'expired' WHERE status = 'pending' AND expires_at < datetime('now')`).run();
        return { expiredCount: res.changes };
    }

static getInviteHistory(db: Database, userId: number, limit: number = 50) {
        const stmt = db.prepare(`
            SELECT gi.*, 
                   sender.username as sender_username, sender.Avatar as sender_avatar, 
                   receiver.username as receiver_username, receiver.Avatar as receiver_avatar
            FROM game_invites gi
            JOIN users sender ON sender.id = gi.sender_id
            JOIN users receiver ON receiver.id = gi.receiver_id
            WHERE (gi.sender_id = ? OR gi.receiver_id = ?)
            
            -- 🛡️ SECURITY 1: Hide if I (Current User) blocked the SENDER
            -- (If I am the Receiver, I shouldn't see invites from people I blocked)
            AND NOT EXISTS (
                SELECT 1 FROM blocked_users b 
                WHERE b.blocker_id = ? AND b.blocked_id = gi.sender_id
            )

            ORDER BY gi.created_at DESC LIMIT ?
        `);

        // Params: [userId,  userId, userId, limit]
        return stmt.all(userId, userId, userId, limit).map((row: any) => this.mapRow(row));
    }

    // 🛠️ HELPER: Centralized mapper to fix date formats safely
    private static mapRow(row: any) {
        return {
            id: row.id,
            senderId: row.sender_id|| 'SYSTEM',
            receiverId: row.receiver_id,
            gameId: row.game_id,
            status: row.status,
            // Convert SQLite "YYYY-MM-DD HH:MM:SS" to JS ISO "YYYY-MM-DDTHH:MM:SSZ"
            // The + 'Z' forces JS to interpret it as UTC, matching the server time
            createdAt: row.created_at.replace(' ', 'T') + 'Z',
            expiresAt: row.expires_at.replace(' ', 'T') + 'Z',
            senderUsername: row.sender_username || 'System',
            senderAvatar: row.sender_avatar,
            receiverUsername: row.receiver_username,
            receiverAvatar: row.receiver_avatar
        };
    }
}