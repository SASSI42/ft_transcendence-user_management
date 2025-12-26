import fp from 'fastify-plugin'
import Database from 'better-sqlite3';
import path from "path";
import { FastifyPluginAsync } from "fastify";

const DatabasePlugin: FastifyPluginAsync = async (fastify) => {
    const dbPath = path.resolve(process.cwd(), 'DATABASE.db');
    // Enable verbose logging if you want to see queries
    const db = new Database(dbPath);
    
    // Enable Foreign Keys (Critical for cascading deletes in chat)
    db.pragma('foreign_keys = ON');

    // 1. Existing Users Table (From User Management)
    db.prepare(`CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT UNIQUE,
        salt TEXT,
        token TEXT,
        Avatar TEXT,
        status NUMERIC
    )`).run();

    // 2. Chat & Friends Tables (From Chat Module)
    
    // Friendships
    db.prepare(`
        CREATE TABLE IF NOT EXISTS friendships (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('pending', 'accepted')) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, friend_id)
        )
    `).run();

    // Messages
    db.prepare(`
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            sender_id INTEGER,
            receiver_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            read BOOLEAN DEFAULT 0,
            is_invite BOOLEAN DEFAULT 0,
            is_blocked BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `).run();

    // Game Invites
    db.prepare(`
        CREATE TABLE IF NOT EXISTS game_invites (
            id TEXT PRIMARY KEY,
            sender_id INTEGER,
            receiver_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
            game_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `).run();

    // Blocked Users
    db.prepare(`
        CREATE TABLE IF NOT EXISTS blocked_users (
            id TEXT PRIMARY KEY,
            blocker_id INTEGER NOT NULL,
            blocked_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(blocker_id, blocked_id)
        )
    `).run();

    // 3. Decorate Fastify
    fastify.decorate('db', db);
    fastify.addHook('onClose', () => {
        db.close();
    });
}

export default fp(DatabasePlugin, {
    name: 'database'
})