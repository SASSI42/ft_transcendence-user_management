"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentRegistry = void 0;
const tournament_1 = require("./tournament");
const tournamentStorage_1 = require("../db/tournamentStorage");
const utils_1 = require("./utils");
class TournamentRegistry {
    tournaments = new Map();
    io;
    roomManager;
    constructor(io, roomManager) {
        this.io = io;
        this.roomManager = roomManager;
    }
    createTournament(name, capacity, creatorUserId, creatorAlias) {
        // Validate capacity is power of 2
        if (!(0, utils_1.isPowerOfTwo)(capacity)) {
            capacity = (0, utils_1.nextPowerOfTwo)(capacity);
        }
        if (capacity < 2 || capacity > 64) {
            return null;
        }
        const tournament = new tournament_1.Tournament(name, capacity, creatorUserId, creatorAlias);
        this.tournaments.set(tournament.state.code, tournament);
        // Save to database
        (0, tournamentStorage_1.saveTournament)(tournament.getState());
        return tournament;
    }
    getTournament(code) {
        // Check in-memory first
        let tournament = this.tournaments.get(code);
        if (tournament)
            return tournament;
        // Load from database
        const state = (0, tournamentStorage_1.getTournament)(code);
        if (state) {
            tournament = tournament_1.Tournament.fromState(state);
            this.tournaments.set(code, tournament);
            return tournament;
        }
        return null;
    }
    joinTournament(code, userId, alias) {
        const tournament = this.getTournament(code);
        if (!tournament)
            return false;
        const success = tournament.addParticipant(userId, alias);
        if (success) {
            (0, tournamentStorage_1.updateTournament)(code, tournament.getState());
            this.broadcastTournamentUpdate(code);
        }
        return success;
    }
    leaveTournament(code, userId) {
        const tournament = this.getTournament(code);
        if (!tournament)
            return false;
        const success = tournament.removeParticipant(userId);
        if (success) {
            (0, tournamentStorage_1.updateTournament)(code, tournament.getState());
            this.broadcastTournamentUpdate(code);
        }
        return success;
    }
    startTournament(code) {
        const tournament = this.getTournament(code);
        if (!tournament)
            return false;
        const success = tournament.start();
        if (success) {
            (0, tournamentStorage_1.updateTournament)(code, tournament.getState());
            this.broadcastTournamentUpdate(code);
            // Start first round matches
            this.startNextRoundMatches(code);
        }
        return success;
    }
    startNextRoundMatches(code) {
        const tournament = this.getTournament(code);
        if (!tournament)
            return;
        const activeMatches = tournament.getActiveMatches();
        // Notify participants about their matches
        for (const match of activeMatches) {
            if (match.player1 && match.player2) {
                this.io.emit('tournament:match-ready', {
                    tournamentCode: code,
                    matchId: match.id,
                    player1: match.player1,
                    player2: match.player2,
                    round: match.round
                });
            }
        }
    }
    recordMatchResult(code, matchId, winnerId) {
        const tournament = this.getTournament(code);
        if (!tournament)
            return false;
        const success = tournament.recordMatchResult(matchId, winnerId);
        if (success) {
            (0, tournamentStorage_1.updateTournament)(code, tournament.getState());
            this.broadcastTournamentUpdate(code);
            // Check if more matches need to be started
            if (tournament.state.status === 'in_progress') {
                this.startNextRoundMatches(code);
            }
            else if (tournament.state.status === 'finished') {
                this.io.emit('tournament:finished', {
                    code,
                    champion: tournament.state.participants.find(p => p.placement === 1)
                });
            }
        }
        return success;
    }
    broadcastTournamentUpdate(code) {
        const tournament = this.getTournament(code);
        if (!tournament)
            return;
        this.io.emit('tournament:update', {
            code,
            state: tournament.getState()
        });
    }
    listActiveTournaments() {
        return Array.from(this.tournaments.values())
            .filter(t => t.state.status !== 'finished')
            .map(t => t.getState());
    }
    deleteTournament(code) {
        this.tournaments.delete(code);
    }
}
exports.TournamentRegistry = TournamentRegistry;
