// Tournament Bracket Generation
import { TournamentMatch, TournamentParticipant } from './types';
import { v4 as uuidv4 } from 'uuid';

// Fisher-Yates shuffle algorithm for unbiased randomization
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function generateBracket(participants: TournamentParticipant[], capacity: number): TournamentMatch[] {
    const bracket: TournamentMatch[] = [];
    const totalRounds = Math.log2(capacity);
    
    // Shuffle participants using Fisher-Yates
    const shuffled = shuffleArray(participants);
    
    // First round matches
    const firstRoundMatches = capacity / 2;
    for (let i = 0; i < firstRoundMatches; i++) {
        const player1 = shuffled[i * 2]?.user_id;
        const player2 = shuffled[i * 2 + 1]?.user_id;
        
        bracket.push({
            id: uuidv4(),
            round: 1,
            match_index: i,
            player1,
            player2,
            status: (player1 && player2) ? 'pending' : 'finished',
            winner: player1 && !player2 ? player1 : (player2 && !player1 ? player2 : undefined)
        });
    }
    
    // Generate empty matches for subsequent rounds
    for (let round = 2; round <= totalRounds; round++) {
        const matchesInRound = capacity / Math.pow(2, round);
        for (let i = 0; i < matchesInRound; i++) {
            bracket.push({
                id: uuidv4(),
                round,
                match_index: i,
                status: 'pending'
            });
        }
    }
    
    return bracket;
}

export function advanceBracket(bracket: TournamentMatch[], matchId: string, winnerId: number): TournamentMatch[] {
    const updatedBracket = [...bracket];
    const matchIndex = updatedBracket.findIndex(m => m.id === matchId);
    
    if (matchIndex === -1) return bracket;
    
    const match = updatedBracket[matchIndex];
    match.winner = winnerId;
    match.status = 'finished';
    
    // Find next match
    const nextRound = match.round + 1;
    const nextMatchIndex = Math.floor(match.match_index / 2);
    const nextMatch = updatedBracket.find(m => m.round === nextRound && m.match_index === nextMatchIndex);
    
    if (nextMatch) {
        // Determine if winner goes to player1 or player2 slot
        const isLeftSide = match.match_index % 2 === 0;
        if (isLeftSide) {
            nextMatch.player1 = winnerId;
        } else {
            nextMatch.player2 = winnerId;
        }
        
        // If both players are set, mark as pending
        if (nextMatch.player1 && nextMatch.player2) {
            nextMatch.status = 'pending';
        }
    }
    
    return updatedBracket;
}

export function getBracketStatus(bracket: TournamentMatch[]): {
    currentRound: number;
    isComplete: boolean;
    champion?: number;
} {
    const maxRound = Math.max(...bracket.map(m => m.round));
    
    // Check if tournament is complete
    const finalMatch = bracket.find(m => m.round === maxRound);
    if (finalMatch?.winner) {
        return {
            currentRound: maxRound,
            isComplete: true,
            champion: finalMatch.winner
        };
    }
    
    // Find current round
    for (let round = 1; round <= maxRound; round++) {
        const roundMatches = bracket.filter(m => m.round === round);
        const hasUnfinished = roundMatches.some(m => m.status !== 'finished');
        if (hasUnfinished) {
            return {
                currentRound: round,
                isComplete: false
            };
        }
    }
    
    return {
        currentRound: maxRound,
        isComplete: false
    };
}
