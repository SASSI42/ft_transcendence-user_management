// Match Storage Module
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'DATABASE.db');
const db = new Database(dbPath);

export interface MatchPlayer {
    match_id: string;
    side: string;
    user_id: number;
    ready: number;
    connected: number;
    last_seen: number;
}

export interface MatchData {
    id: string;
    status: string;
    game_type: string;
    state_json: string;
    rejoin_deadline: number | null;
    created_at: number;
    updated_at: number;
    players: MatchPlayer[];
}

export function saveMatch(match: MatchData): void {
    const insertMatch = db.prepare(`
        INSERT INTO matches (id, status, game_type, state_json, rejoin_deadline, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPlayer = db.prepare(`
        INSERT INTO match_players (match_id, side, user_id, ready, connected, last_seen)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
        insertMatch.run(
            match.id,
            match.status,
            match.game_type,
            match.state_json,
            match.rejoin_deadline,
            match.created_at,
            match.updated_at
        );

        for (const player of match.players) {
            insertPlayer.run(
                player.match_id,
                player.side,
                player.user_id,
                player.ready,
                player.connected,
                player.last_seen
            );
        }
    });

    transaction();
}

export function updateMatch(matchId: string, updates: Partial<MatchData>): void {
    const fields: string[] = [];
    const values: any[] = [];

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

    if (fields.length === 0) return;

    values.push(matchId);

    const query = `UPDATE matches SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);
}

export function getMatch(matchId: string): MatchData | null {
    const match = db.prepare(`
        SELECT * FROM matches WHERE id = ?
    `).get(matchId) as any;

    if (!match) return null;

    const players = db.prepare(`
        SELECT * FROM match_players WHERE match_id = ?
    `).all(matchId) as MatchPlayer[];

    return {
        ...match,
        players
    };
}

export function getMatchesByUser(userId: number, limit: number = 10): MatchData[] {
    const matches = db.prepare(`
        SELECT DISTINCT m.*
        FROM matches m
        JOIN match_players mp ON m.id = mp.match_id
        WHERE mp.user_id = ?
        ORDER BY m.created_at DESC
        LIMIT ?
    `).all(userId, limit) as any[];

    return matches.map(match => {
        const players = db.prepare(`
            SELECT * FROM match_players WHERE match_id = ?
        `).all(match.id) as MatchPlayer[];

        return {
            ...match,
            players
        };
    });
}

export function pruneExpiredMatches(currentTime: number): number {
    const expiredMatches = db.prepare(`
        SELECT id FROM matches
        WHERE status = 'waiting'
        AND created_at < ?
    `).all(currentTime - 300000); // 5 minutes old

    const deleteMatch = db.prepare(`DELETE FROM matches WHERE id = ?`);
    
    let count = 0;
    for (const match of expiredMatches as any[]) {
        deleteMatch.run(match.id);
        count++;
    }

    return count;
}

export function updatePlayerConnection(matchId: string, side: string, connected: boolean): void {
    db.prepare(`
        UPDATE match_players
        SET connected = ?, last_seen = ?
        WHERE match_id = ? AND side = ?
    `).run(connected ? 1 : 0, Date.now(), matchId, side);
}

export function getActiveMatches(): MatchData[] {
    const matches = db.prepare(`
        SELECT * FROM matches
        WHERE status IN ('waiting', 'playing')
        ORDER BY created_at DESC
    `).all() as any[];

    return matches.map(match => {
        const players = db.prepare(`
            SELECT * FROM match_players WHERE match_id = ?
        `).all(match.id) as MatchPlayer[];

        return {
            ...match,
            players
        };
    });
}
