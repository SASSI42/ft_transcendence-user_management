"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveMatch = saveMatch;
exports.updateMatch = updateMatch;
exports.getMatch = getMatch;
exports.getMatchesByUser = getMatchesByUser;
exports.pruneExpiredMatches = pruneExpiredMatches;
exports.updatePlayerConnection = updatePlayerConnection;
exports.getActiveMatches = getActiveMatches;
// Match Storage Module
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.resolve(process.cwd(), 'DATABASE.db');
const db = new better_sqlite3_1.default(dbPath);
function saveMatch(match) {
    const insertMatch = db.prepare(`
        INSERT INTO matches (id, status, game_type, state_json, rejoin_deadline, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPlayer = db.prepare(`
        INSERT INTO match_players (match_id, side, user_id, ready, connected, last_seen)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    const transaction = db.transaction(() => {
        insertMatch.run(match.id, match.status, match.game_type, match.state_json, match.rejoin_deadline, match.created_at, match.updated_at);
        for (const player of match.players) {
            insertPlayer.run(player.match_id, player.side, player.user_id, player.ready, player.connected, player.last_seen);
        }
    });
    transaction();
}
function updateMatch(matchId, updates) {
    const fields = [];
    const values = [];
    if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
    }
    if (updates.state_json !== undefined) {
        fields.push('state_json = ?');
        values.push(updates.state_json);
    }
    if (updates.rejoin_deadline !== undefined) {
        fields.push('rejoin_deadline = ?');
        values.push(updates.rejoin_deadline);
    }
    if (updates.updated_at !== undefined) {
        fields.push('updated_at = ?');
        values.push(updates.updated_at);
    }
    if (fields.length === 0)
        return;
    values.push(matchId);
    const query = `UPDATE matches SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);
}
function getMatch(matchId) {
    const match = db.prepare(`
        SELECT * FROM matches WHERE id = ?
    `).get(matchId);
    if (!match)
        return null;
    const players = db.prepare(`
        SELECT * FROM match_players WHERE match_id = ?
    `).all(matchId);
    return {
        ...match,
        players
    };
}
function getMatchesByUser(userId, limit = 10) {
    const matches = db.prepare(`
        SELECT DISTINCT m.*
        FROM matches m
        JOIN match_players mp ON m.id = mp.match_id
        WHERE mp.user_id = ?
        ORDER BY m.created_at DESC
        LIMIT ?
    `).all(userId, limit);
    return matches.map(match => {
        const players = db.prepare(`
            SELECT * FROM match_players WHERE match_id = ?
        `).all(match.id);
        return {
            ...match,
            players
        };
    });
}
function pruneExpiredMatches(currentTime) {
    const expiredMatches = db.prepare(`
        SELECT id FROM matches
        WHERE status = 'waiting'
        AND created_at < ?
    `).all(currentTime - 300000); // 5 minutes old
    const deleteMatch = db.prepare(`DELETE FROM matches WHERE id = ?`);
    let count = 0;
    for (const match of expiredMatches) {
        deleteMatch.run(match.id);
        count++;
    }
    return count;
}
function updatePlayerConnection(matchId, side, connected) {
    db.prepare(`
        UPDATE match_players
        SET connected = ?, last_seen = ?
        WHERE match_id = ? AND side = ?
    `).run(connected ? 1 : 0, Date.now(), matchId, side);
}
function getActiveMatches() {
    const matches = db.prepare(`
        SELECT * FROM matches
        WHERE status IN ('waiting', 'playing')
        ORDER BY created_at DESC
    `).all();
    return matches.map(match => {
        const players = db.prepare(`
            SELECT * FROM match_players WHERE match_id = ?
        `).all(match.id);
        return {
            ...match,
            players
        };
    });
}
