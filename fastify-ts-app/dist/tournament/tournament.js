"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tournament = void 0;
const bracket_1 = require("./bracket");
const utils_1 = require("./utils");
class Tournament {
    state;
    constructor(name, capacity, creatorUserId, creatorAlias) {
        this.state = {
            code: (0, utils_1.generateTournamentCode)(),
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
    addParticipant(userId, alias) {
        if (this.state.status !== 'waiting')
            return false;
        if (this.state.participants.length >= this.state.capacity)
            return false;
        if (this.state.participants.some(p => p.user_id === userId))
            return false;
        this.state.participants.push({
            user_id: userId,
            alias,
            eliminated: false
        });
        this.state.updated_at = Date.now();
        return true;
    }
    removeParticipant(userId) {
        if (this.state.status !== 'waiting')
            return false;
        const index = this.state.participants.findIndex(p => p.user_id === userId);
        if (index === -1)
            return false;
        this.state.participants.splice(index, 1);
        this.state.updated_at = Date.now();
        return true;
    }
    canStart() {
        return this.state.participants.length >= 2 &&
            this.state.status === 'waiting';
    }
    start() {
        if (!this.canStart())
            return false;
        this.state.status = 'in_progress';
        this.state.bracket = (0, bracket_1.generateBracket)(this.state.participants, this.state.capacity);
        this.state.currentRound = 1;
        this.state.updated_at = Date.now();
        return true;
    }
    recordMatchResult(matchId, winnerId) {
        if (this.state.status !== 'in_progress')
            return false;
        this.state.bracket = (0, bracket_1.advanceBracket)(this.state.bracket, matchId, winnerId);
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
        const status = (0, bracket_1.getBracketStatus)(this.state.bracket);
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
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }
    getActiveMatches() {
        return this.state.bracket.filter(m => m.status === 'pending' &&
            m.player1 !== undefined &&
            m.player2 !== undefined);
    }
    static fromState(state) {
        const tournament = Object.create(Tournament.prototype);
        tournament.state = state;
        return tournament;
    }
}
exports.Tournament = Tournament;
