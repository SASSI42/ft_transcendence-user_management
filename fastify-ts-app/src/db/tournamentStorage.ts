// Tournament Storage Module
import Database from 'better-sqlite3';
import path from 'path';
import { TournamentState, TournamentParticipant } from '../tournament/types';

const dbPath = path.resolve(process.cwd(), 'DATABASE.db');
const db = new Database(dbPath);

export function saveTournament(tournament: TournamentState): void {
    const insertTournament = db.prepare(`
        INSERT INTO tournaments (code, name, status, capacity, created_at, updated_at, state_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertParticipant = db.prepare(`
        INSERT INTO tournament_participants (tournament_code, user_id, alias, eliminated, placement)
        VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
        insertTournament.run(
            tournament.code,
            tournament.name,
            tournament.status,
            tournament.capacity,
            tournament.created_at,
            tournament.updated_at,
            JSON.stringify(tournament)
        );

        for (const participant of tournament.participants) {
            insertParticipant.run(
                tournament.code,
                participant.user_id,
                participant.alias,
                participant.eliminated ? 1 : 0,
                participant.placement || null
            );
        }
    });

    transaction();
}

export function updateTournament(code: string, tournament: TournamentState): void {
    const updateQuery = db.prepare(`
        UPDATE tournaments
        SET status = ?, updated_at = ?, state_json = ?
        WHERE code = ?
    `);

    const deleteParticipants = db.prepare(`
        DELETE FROM tournament_participants WHERE tournament_code = ?
    `);

    const insertParticipant = db.prepare(`
        INSERT INTO tournament_participants (tournament_code, user_id, alias, eliminated, placement)
        VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
        updateQuery.run(
            tournament.status,
            tournament.updated_at,
            JSON.stringify(tournament),
            code
        );

        deleteParticipants.run(code);

        for (const participant of tournament.participants) {
            insertParticipant.run(
                code,
                participant.user_id,
                participant.alias,
                participant.eliminated ? 1 : 0,
                participant.placement || null
            );
        }
    });

    transaction();
}

export function getTournament(code: string): TournamentState | null {
    const tournament = db.prepare(`
        SELECT * FROM tournaments WHERE code = ?
    `).get(code) as any;

    if (!tournament) return null;

    return JSON.parse(tournament.state_json);
}

export function getActiveTournaments(): TournamentState[] {
    const tournaments = db.prepare(`
        SELECT * FROM tournaments
        WHERE status IN ('waiting', 'in_progress')
        ORDER BY created_at DESC
    `).all() as any[];

    return tournaments.map(t => JSON.parse(t.state_json));
}

export function getTournamentsByUser(userId: number, limit: number = 10): TournamentState[] {
    const tournaments = db.prepare(`
        SELECT DISTINCT t.*
        FROM tournaments t
        JOIN tournament_participants tp ON t.code = tp.tournament_code
        WHERE tp.user_id = ?
        ORDER BY t.created_at DESC
        LIMIT ?
    `).all(userId, limit) as any[];

    return tournaments.map(t => JSON.parse(t.state_json));
}

export function deleteTournament(code: string): void {
    db.prepare(`DELETE FROM tournaments WHERE code = ?`).run(code);
}
