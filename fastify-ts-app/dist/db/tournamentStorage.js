"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveTournament = saveTournament;
exports.updateTournament = updateTournament;
exports.getTournament = getTournament;
exports.getActiveTournaments = getActiveTournaments;
exports.getTournamentsByUser = getTournamentsByUser;
exports.deleteTournament = deleteTournament;
// Tournament Storage Module
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.resolve(process.cwd(), 'DATABASE.db');
const db = new better_sqlite3_1.default(dbPath);
function saveTournament(tournament) {
    const insertTournament = db.prepare(`
        INSERT INTO tournaments (code, name, status, capacity, created_at, updated_at, state_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertParticipant = db.prepare(`
        INSERT INTO tournament_participants (tournament_code, user_id, alias, eliminated, placement)
        VALUES (?, ?, ?, ?, ?)
    `);
    const transaction = db.transaction(() => {
        insertTournament.run(tournament.code, tournament.name, tournament.status, tournament.capacity, tournament.created_at, tournament.updated_at, JSON.stringify(tournament));
        for (const participant of tournament.participants) {
            insertParticipant.run(tournament.code, participant.user_id, participant.alias, participant.eliminated ? 1 : 0, participant.placement || null);
        }
    });
    transaction();
}
function updateTournament(code, tournament) {
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
        updateQuery.run(tournament.status, tournament.updated_at, JSON.stringify(tournament), code);
        deleteParticipants.run(code);
        for (const participant of tournament.participants) {
            insertParticipant.run(code, participant.user_id, participant.alias, participant.eliminated ? 1 : 0, participant.placement || null);
        }
    });
    transaction();
}
function getTournament(code) {
    const tournament = db.prepare(`
        SELECT * FROM tournaments WHERE code = ?
    `).get(code);
    if (!tournament)
        return null;
    return JSON.parse(tournament.state_json);
}
function getActiveTournaments() {
    const tournaments = db.prepare(`
        SELECT * FROM tournaments
        WHERE status IN ('waiting', 'in_progress')
        ORDER BY created_at DESC
    `).all();
    return tournaments.map(t => JSON.parse(t.state_json));
}
function getTournamentsByUser(userId, limit = 10) {
    const tournaments = db.prepare(`
        SELECT DISTINCT t.*
        FROM tournaments t
        JOIN tournament_participants tp ON t.code = tp.tournament_code
        WHERE tp.user_id = ?
        ORDER BY t.created_at DESC
        LIMIT ?
    `).all(userId, limit);
    return tournaments.map(t => JSON.parse(t.state_json));
}
function deleteTournament(code) {
    db.prepare(`DELETE FROM tournaments WHERE code = ?`).run(code);
}
