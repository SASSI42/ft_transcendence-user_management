"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const uuid_1 = require("uuid");
const FriendsService_1 = require("./FriendsService");
class MessagesService {
    // 1. Update signature to accept isInvite (default false)
    static sendMessage(db, senderId, receiverId, content, isInvite = false) {
        if (FriendsService_1.FriendsService.isBlocked(db, receiverId, senderId))
            throw new Error('You have blocked this user');
        if (!FriendsService_1.FriendsService.areFriends(db, senderId, receiverId))
            throw new Error('Can only send messages to friends');
        const isBlockedByReceiver = FriendsService_1.FriendsService.isBlocked(db, senderId, receiverId);
        const id = (0, uuid_1.v4)();
        if (content.length > 2000) {
            content = content.slice(0, 2000);
        }
        // 2. Insert into DB with is_invite column
        // SQLite stores booleans as 1 or 0
        db.prepare(`INSERT INTO messages (id, sender_id, receiver_id, content, is_invite, is_blocked) VALUES (?, ?, ?, ?, ?, ?)`).run(id, senderId, receiverId, content, isInvite ? 1 : 0, isBlockedByReceiver ? 1 : 0);
        return { id, senderId, receiverId, content, read: false, isInvite, isBlocked: isBlockedByReceiver, createdAt: new Date() };
    }
    // 🛠️ NEW: Update the invite message status
    static updateInviteMessage(db, inviteId, status) {
        // Find the message containing this invite ID
        const msg = db.prepare(`SELECT * FROM messages WHERE content LIKE ?`).get(`INVITE::${inviteId}%`);
        if (msg) {
            const newContent = `INVITE::${inviteId}::${status}`;
            db.prepare(`UPDATE messages SET content = ? WHERE id = ?`).run(newContent, msg.id);
            // Return the updated message formatted for frontend
            return {
                id: msg.id,
                senderId: msg.sender_id,
                receiverId: msg.receiver_id,
                content: newContent,
                read: !!msg.read,
                isInvite: !!msg.is_invite,
                isBlocked: !!msg.is_blocked,
                createdAt: new Date(msg.created_at + 'Z').toISOString()
            };
        }
        return null;
    }
    static getMessageHistory(db, userId1, userId2, limit = 50, offset = 0) {
        const stmt = db.prepare(`
            SELECT m.id, m.sender_id, m.receiver_id, m.content, m.read, m.is_invite, m.is_blocked, m.created_at, 
                   sender.username as sender_username, sender.Avatar as sender_avatar
            FROM messages m
            JOIN users sender ON sender.id = m.sender_id
            WHERE 
                ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
                
                -- 🛡️ SECURITY FILTER:
                -- Show message IF: 
                -- 1. It is NOT blocked
                -- 2. OR It IS blocked but *I* sent it (so I can see my ghosted msgs)
                AND (m.is_blocked = 0 OR m.sender_id = ?)
                
            ORDER BY m.created_at ASC LIMIT ? OFFSET ?
        `);
        // Params: [u1, u2, u2, u1, CurrentUser(u1), limit, offset]
        // Note: userId1 is usually the "Current User" asking for history
        return stmt.all(userId1, userId2, userId2, userId1, userId1, limit, offset).map((msg) => ({
            id: msg.id,
            senderId: msg.sender_id || 'SYSTEM',
            receiverId: msg.receiver_id,
            content: msg.content,
            read: !!msg.read,
            isInvite: !!msg.is_invite,
            isBlocked: !!msg.is_blocked,
            createdAt: msg.created_at.replace(' ', 'T') + 'Z',
            senderUsername: msg.sender_username || 'System',
            senderAvatar: msg.sender_avatar
        }));
    }
    static markAsRead(db, messageId, userId) {
        const res = db.prepare(`UPDATE messages SET read = 1 WHERE id = ? AND receiver_id = ?`).run(messageId, userId);
        return { success: res.changes > 0 };
    }
    static markAllAsRead(db, userId, senderId) {
        const res = db.prepare(`UPDATE messages SET read = 1 WHERE receiver_id = ? AND sender_id = ? AND read = 0`).run(userId, senderId);
        return { count: res.changes };
    }
    static getUnreadCount(db, userId) {
        const res = db.prepare(`SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND read = 0 AND is_blocked = 0`).get(userId);
        return res.count;
    }
    static getUnreadMessagesBySender(db, userId) {
        const stmt = db.prepare(`
            SELECT m.sender_id, u.username, u.Avatar, COUNT(*) as unread_count, MAX(m.created_at) as last_message_time
            FROM messages m JOIN users u ON u.id = m.sender_id
            WHERE m.receiver_id = ? AND m.read = 0 AND m.is_blocked = 0
            GROUP BY m.sender_id ORDER BY last_message_time DESC
        `);
        return stmt.all(userId).map((row) => ({
            senderId: row.sender_id,
            username: row.username,
            avatarUrl: row.Avatar,
            unreadCount: row.unread_count,
            lastMessageTime: row.last_message_time ? row.last_message_time.replace(' ', 'T') + 'Z' : null
        }));
    }
}
exports.MessagesService = MessagesService;
