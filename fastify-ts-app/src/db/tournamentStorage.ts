// Tournament state persistence using in-memory storage
// In production, this should be replaced with actual database storage

import type { SerializedBracketState } from "../tournament/bracket";

export interface StoredTournamentParticipant {
    alias: string;
    joinedAt: number;
    lastSeenAt: number;
    ready: boolean;
    inMatch: boolean;
}

export interface StoredTournamentActiveMatch {
    matchId: string;
    aliases: [string, string];
    roomId: string;
}

export interface StoredTournamentState {
    code: string;
    name: string;
    status: "registering" | "in_progress" | "completed";
    capacity: number;
    createdAt: number;
    updatedAt: number;
    participants: StoredTournamentParticipant[];
    activeMatches: StoredTournamentActiveMatch[];
    bracket: SerializedBracketState | null;
}

// In-memory storage (replace with actual database in production)
const tournamentStorage = new Map<string, StoredTournamentState>();

export function saveTournamentState(state: StoredTournamentState): void {
    tournamentStorage.set(state.code, state);
}

export function loadTournamentState(code: string): StoredTournamentState | null {
    return tournamentStorage.get(code) || null;
}

export function loadAllTournaments(): StoredTournamentState[] {
    return Array.from(tournamentStorage.values());
}

export function deleteTournament(code: string): void {
    tournamentStorage.delete(code);
}

export function clearAllTournaments(): void {
    tournamentStorage.clear();
}
