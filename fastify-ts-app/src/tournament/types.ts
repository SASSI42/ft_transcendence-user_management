// Tournament Type Definitions
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
    player1?: number; // user_id
    player2?: number; // user_id
    winner?: number; // user_id
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
