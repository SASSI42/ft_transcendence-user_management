
import { v4 as uuidv4 } from 'uuid';
import { Database } from 'better-sqlite3';

export class FriendsService {
    // Send friend request
    static sendFriendRequest(db: Database, userId: number, friendId: number) {
        const existing = db.prepare(`
            SELECT * FROM friendships 
            WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        `).get(userId, friendId, friendId, userId);

        // 2. ⚡ AUTO-ACCEPT LOGIC (The Upgrade)
        // Check if THEY already sent ME a request that is pending
        const incomingRequest = db.prepare(`
            SELECT * FROM friendships 
            WHERE user_id = ? AND friend_id = ? AND status = 'pending'
        `).get(friendId, userId) as any; // Note: user_id=friendId (Sender), friend_id=userId (Receiver)

        if (incomingRequest) {
            // They asked first, and now I asked them. That means YES.
            db.prepare(`UPDATE friendships SET status = 'accepted' WHERE id = ?`).run(incomingRequest.id);
            return { ...incomingRequest, status: 'accepted' };
        }

        if (existing) {
            throw new Error('Relationship already exists');
        }

        const id = uuidv4();
        const stmt = db.prepare(`
            INSERT INTO friendships (id, user_id, friend_id, status)
            VALUES (?, ?, ?, 'pending')
        `);

        stmt.run(id, userId, friendId);

        return { id, userId, friendId, status: 'pending' };
    }

    // Accept friend request
    static acceptFriendRequest(db: Database, friendshipId: string) {
        const stmt = db.prepare(`
            UPDATE friendships 
            SET status = 'accepted'
            WHERE id = ? AND status = 'pending'
        `);

        const result = stmt.run(friendshipId);
        if (result.changes === 0) {
            throw new Error('Friend request not found');
        }

        return { success: true };
    }

    // Decline friend request
    static declineFriendRequest(db: Database, friendshipId: string) {
        // 1. Fetch first so we know who to notify
        const request = db.prepare('SELECT * FROM friendships WHERE id = ?').get(friendshipId) as any;
        
        if (!request) {
            // Already deleted or doesn't exist
            throw new Error('Friend request not found');
        }
        
        const stmt = db.prepare(`
            DELETE FROM friendships 
            WHERE id = ? AND status = 'pending'
        `);

        const result = stmt.run(friendshipId);
        if (result.changes === 0) {
            throw new Error('Friend request not found');
        }

        return { 
            id: request.id, 
            userId: request.user_id,   // The Sender
            friendId: request.friend_id // The Receiver
        };
    }

    // Remove friend
    static removeFriend(db: Database, userId: number, friendId: number) {
        // 1. Remove from friendships
        db.prepare(`DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`).run(userId, friendId, friendId, userId);
        
        // 2. 🛠️ FIX: Also remove from blocked_users in BOTH directions
        db.prepare(`DELETE FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`).run(userId, friendId, friendId, userId);

        return { success: true };
    }

    // Block user
    static blockUser(db: Database, userId: number, blockedUserId: number) {
        // Check if already blocked to prevent errors
        const existing = db.prepare('SELECT id FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?').get(userId, blockedUserId);
        if (existing) return { success: true };

        const id = uuidv4();
        db.prepare('INSERT INTO blocked_users (id, blocker_id, blocked_id) VALUES (?, ?, ?)')
          .run(id, userId, blockedUserId);

        return { success: true };
    }

    // Unblock user
    static unblockUser(db: Database, userId: number, blockedUserId: number) {
        db.prepare('DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?')
          .run(userId, blockedUserId);
        return { success: true };
    }


// Get friends list (FIXED FOR GHOSTING & SELF-INCLUSION)
static getFriends(db: Database, userId: number) {
        const stmt = db.prepare(`
            SELECT 
                u.id, 
                u.username, 
                u.Avatar,
                f.id as friendshipId
            FROM friendships f
            
            -- 1. Smart Join: Only join the 'other' user
            JOIN users u ON u.id = CASE 
                WHEN f.user_id = ? THEN f.friend_id 
                ELSE f.user_id 
            END
            
            -- 2. Check if I blocked them
            LEFT JOIN blocked_users b1 ON b1.blocker_id = ? AND b1.blocked_id = u.id
            
            WHERE 
                (f.user_id = ? OR f.friend_id = ?) 
                AND f.status = 'accepted'
                -- 3. Exclude if block exists
                AND b1.id IS NULL
        `);
        
        // Params: [userId, userId, userId, userId] maps to the 4 '?' above
        return stmt.all(userId, userId, userId, userId).map((friend: any) => ({
            id: friend.id,
            username: friend.username,
            avatarUrl: friend.Avatar,
            friendshipId: friend.friendshipId,
            status: 'offline' 
        }));
    }

    static getFriendsToNotify(db: Database, userId: number) {
        const stmt = db.prepare(`
            SELECT 
                CASE 
                    WHEN f.user_id = ? THEN f.friend_id 
                    ELSE f.user_id 
                END as id
            FROM friendships f
            WHERE 
                (f.user_id = ? OR f.friend_id = ?) 
                AND f.status = 'accepted'
        `);
        return stmt.all(userId, userId, userId);
    }

    // Get blocked users
    static getBlockedUsers(db: Database, userId: number) {
        const stmt = db.prepare(`
            SELECT u.id, u.username, u.Avatar
            FROM blocked_users b
            JOIN users u ON u.id = b.blocked_id
            WHERE b.blocker_id = ?
        `);
        return stmt.all(userId);
    }

    // Get pending friend requests
    static getPendingRequests(db: Database, userId: number) {
        const stmt = db.prepare(`
            SELECT 
                u.id, 
                u.username, 
                u.Avatar,
                f.id as friendshipId
            FROM friendships f
            JOIN users u ON u.id = f.user_id
            WHERE f.friend_id = ? AND f.status = 'pending'
        `);
        return stmt.all(userId);
    }

    // Get sent friend requests
static getSentRequests(db: Database, userId: number) {
        const stmt = db.prepare(`
            SELECT 
                f.id,
                f.user_id,
                f.friend_id,
                f.status,
                u.username,          -- ✅ Fetch the Username
                u.Avatar as avatarUrl -- ✅ Fetch the Avatar
            FROM friendships f
            JOIN users u ON f.friend_id = u.id -- Join with the Receiver
            WHERE f.user_id = ? AND f.status = 'pending'
        `);
        return stmt.all(userId);
    }

    // Helper: Are they friends?
    static areFriends(db: Database, userId1: number, userId2: number) {
        const stmt = db.prepare(`
            SELECT count(*) as count FROM friendships 
            WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
            AND status = 'accepted'
        `);
        const result = stmt.get(userId1, userId2, userId2, userId1) as { count: number };
        return result.count > 0;
    }

    // Helper: Is blocked?
    static isBlocked(db: Database, userId: number, potentialBlockerId: number) {
        // "Is userId blocked by potentialBlockerId?"
        const stmt = db.prepare(`
            SELECT count(*) as count FROM blocked_users 
            WHERE blocker_id = ? AND blocked_id = ?
        `);
        const result = stmt.get(potentialBlockerId, userId) as { count: number };
        return result.count > 0;
    }
}