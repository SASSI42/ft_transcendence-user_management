import type { Server } from "socket.io";
import { GameRoomManager } from "../game/gameRoom";
import { Tournament } from "./tournament";
import { generateTournamentCode } from "./utils";
import { loadAllTournaments, deleteTournament as deleteTournamentRecord } from "../db/tournamentStorage";

export class TournamentRegistry {
	private readonly tournaments = new Map<string, Tournament>();
	public io: Server;

	public constructor(io: Server, private readonly roomManager: GameRoomManager) {
		this.io = io;
	}

	public hydrateFromStorage(): void {
		const storedTournaments = loadAllTournaments();
		for (const stored of storedTournaments) {
			if (this.tournaments.has(stored.code)) {
				continue;
			}
			if (stored.status === "completed" && stored.participants.length === 0) {
				deleteTournamentRecord(stored.code);
				continue;
			}
			const tournament = Tournament.fromStored(this.io, this.roomManager, stored);
			this.tournaments.set(stored.code, tournament);
		}
	}

	public create(name: string, capacity = 8): Tournament {
		let code: string;
		do {
			code = generateTournamentCode();
		} while (this.tournaments.has(code));

		const tournament = new Tournament(this.io, this.roomManager, code, name, capacity);
		this.tournaments.set(code, tournament);
		return tournament;
	}

	public get(code: string): Tournament | undefined {
		return this.tournaments.get(code);
	}

	public remove(code: string): void {
		const tournament = this.tournaments.get(code);
		if (!tournament) {
			return;
		}
		tournament.destroy();
		this.tournaments.delete(code);
	}

	public tryStartMatches(code: string): boolean {
		const tournament = this.tournaments.get(code);
		if (!tournament) {
			return false;
		}

		let started = false;
		let needsUpdate = false;
		while (true) {
			const claim = tournament.claimReadyMatch();
			if (!claim) {
				break;
			}

			const { matchId, aliases } = claim;
			const [leftAlias, rightAlias] = aliases;
			const leftSocket = tournament.getSocket(leftAlias);
			const rightSocket = tournament.getSocket(rightAlias);
			if (!leftSocket || !rightSocket) {
				needsUpdate = true;
				tournament.releaseActiveMatch(matchId, aliases);
				continue;
			}

			// Use real authenticated user IDs from tournament participants
			const leftUserId = tournament.getUserId(leftAlias);
			const rightUserId = tournament.getUserId(rightAlias);
			
			if (!leftUserId || !rightUserId) {
				console.error(`[tournament] Missing user IDs for match ${matchId} in tournament ${code}`, { leftAlias, rightAlias });
				needsUpdate = true;
				tournament.releaseActiveMatch(matchId, aliases);
				continue;
			}

			const room = this.roomManager.createRoom(
				{ socket: leftSocket, userId: leftUserId, username: leftAlias },
				{ socket: rightSocket, userId: rightUserId, username: rightAlias }
			);

			tournament.markMatchReserved(matchId, aliases, room.id);
			tournament.broadcastUpdate();
			started = true;
		}

		if (needsUpdate) {
			tournament.broadcastUpdate();
		}

		return started;
	}

	public cleanupIfEmpty(code: string): void {
		const tournament = this.tournaments.get(code);
		if (!tournament) {
			return;
		}
		if (tournament.totalCount() === 0) {
			this.remove(code);
		}
	}

	public all(): Tournament[] {
		return [...this.tournaments.values()];
	}
}
