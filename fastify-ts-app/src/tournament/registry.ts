// Tournament Registry Manager
import { Server } from 'socket.io';
import { Tournament } from './tournament';
import { saveTournament, updateTournament, getTournament } from '../db/tournamentStorage';
import { GameRoomManager } from '../game/gameRoom';
import { isPowerOfTwo, nextPowerOfTwo } from './utils';

export class TournamentRegistry {
    private tournaments = new Map<string, Tournament>();
    private io: Server;
    private roomManager: GameRoomManager;

    constructor(io: Server, roomManager: GameRoomManager) {
        this.io = io;
        this.roomManager = roomManager;
    }

    createTournament(name: string, capacity: number, creatorUserId: number, creatorAlias: string): Tournament | null {
        // Validate capacity is power of 2
        if (!isPowerOfTwo(capacity)) {
            capacity = nextPowerOfTwo(capacity);
        }

        if (capacity < 2 || capacity > 64) {
            return null;
        }

        const tournament = new Tournament(name, capacity, creatorUserId, creatorAlias);
        this.tournaments.set(tournament.state.code, tournament);

        // Save to database
        saveTournament(tournament.getState());

        return tournament;
    }

    getTournament(code: string): Tournament | null {
        // Check in-memory first
        let tournament = this.tournaments.get(code);
        if (tournament) return tournament;

        // Load from database
        const state = getTournament(code);
        if (state) {
            tournament = Tournament.fromState(state);
            this.tournaments.set(code, tournament);
            return tournament;
        }

        return null;
    }

    joinTournament(code: string, userId: number, alias: string): boolean {
        const tournament = this.getTournament(code);
        if (!tournament) return false;

        const success = tournament.addParticipant(userId, alias);
        if (success) {
            updateTournament(code, tournament.getState());
            this.broadcastTournamentUpdate(code);
        }

        return success;
    }

    leaveTournament(code: string, userId: number): boolean {
        const tournament = this.getTournament(code);
        if (!tournament) return false;

        const success = tournament.removeParticipant(userId);
        if (success) {
            updateTournament(code, tournament.getState());
            this.broadcastTournamentUpdate(code);
        }

        return success;
    }

    startTournament(code: string): boolean {
        const tournament = this.getTournament(code);
        if (!tournament) return false;

        const success = tournament.start();
        if (success) {
            updateTournament(code, tournament.getState());
            this.broadcastTournamentUpdate(code);
            
            // Start first round matches
            this.startNextRoundMatches(code);
        }

        return success;
    }

    private startNextRoundMatches(code: string) {
        const tournament = this.getTournament(code);
        if (!tournament) return;

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

    recordMatchResult(code: string, matchId: string, winnerId: number): boolean {
        const tournament = this.getTournament(code);
        if (!tournament) return false;

        const success = tournament.recordMatchResult(matchId, winnerId);
        if (success) {
            updateTournament(code, tournament.getState());
            this.broadcastTournamentUpdate(code);

            // Check if more matches need to be started
            if (tournament.state.status === 'in_progress') {
                this.startNextRoundMatches(code);
            } else if (tournament.state.status === 'finished') {
                this.io.emit('tournament:finished', {
                    code,
                    champion: tournament.state.participants.find(p => p.placement === 1)
                });
            }
        }

        return success;
    }

    private broadcastTournamentUpdate(code: string) {
        const tournament = this.getTournament(code);
        if (!tournament) return;

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

    deleteTournament(code: string) {
        this.tournaments.delete(code);
    }
}
