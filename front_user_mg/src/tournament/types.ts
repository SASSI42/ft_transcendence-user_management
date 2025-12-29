// Tournament Types
export type TournamentStatus = 'waiting' | 'in_progress' | 'finished';

export interface TournamentParticipant {
    user_id: number;
    alias: string;
    eliminated: boolean;
    placement?: number;
}

export interface TournamentMatch {
    id: string;
    round: number;
    match_index: number;
    player1?: number;
    player2?: number;
    winner?: number;
    status: 'pending' | 'in_progress' | 'finished';
}

export interface TournamentState {
    code: string;
    name: string;
    status: TournamentStatus;
    capacity: number;
    participants: TournamentParticipant[];
    bracket: TournamentMatch[];
    currentRound: number;
    created_at: number;
    updated_at: number;
}
