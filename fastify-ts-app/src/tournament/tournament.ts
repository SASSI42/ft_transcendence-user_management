// Tournament State Management
import { TournamentState, TournamentParticipant, TournamentStatus } from './types';
import { generateBracket, advanceBracket, getBracketStatus } from './bracket';
import { generateTournamentCode } from './utils';

export class Tournament {
    state: TournamentState;

    constructor(name: string, capacity: number, creatorUserId: number, creatorAlias: string) {
        this.state = {
            code: generateTournamentCode(),
            name,
            status: 'waiting',
            capacity,
            participants: [{
                user_id: creatorUserId,
                alias: creatorAlias,
                eliminated: false
            }],
            bracket: [],
            currentRound: 0,
            created_at: Date.now(),
            updated_at: Date.now()
        };
    }

    addParticipant(userId: number, alias: string): boolean {
        if (this.state.status !== 'waiting') return false;
        if (this.state.participants.length >= this.state.capacity) return false;
        if (this.state.participants.some(p => p.user_id === userId)) return false;

        this.state.participants.push({
            user_id: userId,
            alias,
            eliminated: false
        });
        this.state.updated_at = Date.now();
        return true;
    }

    removeParticipant(userId: number): boolean {
        if (this.state.status !== 'waiting') return false;

        const index = this.state.participants.findIndex(p => p.user_id === userId);
        if (index === -1) return false;

        this.state.participants.splice(index, 1);
        this.state.updated_at = Date.now();
        return true;
    }

    canStart(): boolean {
        return this.state.participants.length >= 2 && 
               this.state.status === 'waiting';
    }

    start(): boolean {
        if (!this.canStart()) return false;

        this.state.status = 'in_progress';
        this.state.bracket = generateBracket(this.state.participants, this.state.capacity);
        this.state.currentRound = 1;
        this.state.updated_at = Date.now();
        return true;
    }

    recordMatchResult(matchId: string, winnerId: number): boolean {
        if (this.state.status !== 'in_progress') return false;

        this.state.bracket = advanceBracket(this.state.bracket, matchId, winnerId);
        
        // Mark loser as eliminated
        const match = this.state.bracket.find(m => m.id === matchId);
        if (match) {
            const loserId = match.player1 === winnerId ? match.player2 : match.player1;
            if (loserId) {
                const loser = this.state.participants.find(p => p.user_id === loserId);
                if (loser) {
                    loser.eliminated = true;
                }
            }
        }

        // Check if tournament is complete
        const status = getBracketStatus(this.state.bracket);
        this.state.currentRound = status.currentRound;
        
        if (status.isComplete && status.champion) {
            this.state.status = 'finished';
            // Set placements (simplified)
            const champion = this.state.participants.find(p => p.user_id === status.champion);
            if (champion) {
                champion.placement = 1;
            }
        }

        this.state.updated_at = Date.now();
        return true;
    }

    getState(): TournamentState {
        return JSON.parse(JSON.stringify(this.state));
    }

    getActiveMatches() {
        return this.state.bracket.filter(m => 
            m.status === 'pending' && 
            m.player1 !== undefined && 
            m.player2 !== undefined
        );
    }

    static fromState(state: TournamentState): Tournament {
        const tournament = Object.create(Tournament.prototype);
        tournament.state = state;
        return tournament;
    }
}
