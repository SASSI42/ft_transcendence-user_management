// Game-specific Socket Handlers
import { Server, Socket } from 'socket.io';
import { GameRoomManager } from '../game/gameRoom';
import { MatchmakingService } from '../game/matchmaking';
import { TournamentRegistry } from '../tournament/registry';
import type { InputCommand } from '../game/gameLogic';

// Global instances (should be passed from main handler or created as singletons)
let matchmakingService: MatchmakingService;
let roomManager: GameRoomManager;
let tournamentRegistry: TournamentRegistry;

export function initializeGameServices(io: Server) {
    matchmakingService = new MatchmakingService();
    roomManager = new GameRoomManager(io);
    tournamentRegistry = new TournamentRegistry(io, roomManager);
}

export function registerGameHandlers(
    io: Server,
    socket: Socket,
    userId: number,
    username: string
) {
    // Ensure services are initialized
    if (!matchmakingService || !roomManager || !tournamentRegistry) {
        initializeGameServices(io);
    }

    // Join matchmaking queue
    socket.on('client:join', () => {
        const pairing = matchmakingService.enqueue(socket, username, userId);
        if (!pairing) {
            socket.emit('server:queue', {
                status: 'waiting',
                position: matchmakingService.pendingCount(),
            });
            return;
        }

        // Create game room for matched players
        const room = roomManager.createRoom(pairing);
    });

    // Leave matchmaking queue
    socket.on('client:leave-queue', () => {
        const removed = matchmakingService.remove(socket.id);
        if (removed) {
            socket.emit('server:queue', {
                status: 'left'
            });
        }
    });

    // Game input commands
    socket.on('client:input', (payload: { command?: InputCommand }) => {
        if (!payload.command) return;
        roomManager.applyInput(socket.id, payload.command);
    });

    // Mark ready for game start
    socket.on('client:ready', () => {
        roomManager.markReady(socket.id);
    });

    // Tournament: Create
    socket.on('client:tournament:create', (payload: { 
        name?: string; 
        alias?: string; 
        capacity?: number 
    }) => {
        if (!payload.name || !payload.alias || !payload.capacity) {
            socket.emit('server:error', { message: 'Missing required fields' });
            return;
        }

        const tournament = tournamentRegistry.createTournament(
            payload.name,
            payload.capacity,
            userId,
            payload.alias
        );

        if (!tournament) {
            socket.emit('server:error', { message: 'Failed to create tournament' });
            return;
        }

        socket.emit('server:tournament:created', {
            code: tournament.state.code,
            state: tournament.getState()
        });
    });

    // Tournament: Join
    socket.on('client:tournament:join', (payload: { code?: string; alias?: string }) => {
        if (!payload.code || !payload.alias) {
            socket.emit('server:error', { message: 'Missing required fields' });
            return;
        }

        const success = tournamentRegistry.joinTournament(payload.code, userId, payload.alias);
        
        if (!success) {
            socket.emit('server:error', { message: 'Failed to join tournament' });
            return;
        }

        const tournament = tournamentRegistry.getTournament(payload.code);
        if (tournament) {
            socket.emit('server:tournament:joined', {
                code: payload.code,
                state: tournament.getState()
            });
        }
    });

    // Tournament: Leave
    socket.on('client:tournament:leave', (payload: { code?: string }) => {
        if (!payload.code) return;

        tournamentRegistry.leaveTournament(payload.code, userId);
    });

    // Tournament: Start
    socket.on('client:tournament:start', (payload: { code?: string }) => {
        if (!payload.code) return;

        const success = tournamentRegistry.startTournament(payload.code);
        
        if (!success) {
            socket.emit('server:error', { message: 'Failed to start tournament' });
        }
    });

    // Tournament: List active
    socket.on('client:tournament:list', () => {
        const tournaments = tournamentRegistry.listActiveTournaments();
        socket.emit('server:tournament:list', tournaments);
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
        matchmakingService.remove(socket.id);
        roomManager.handleDisconnect(socket.id);
    });
}

export function getGameServices() {
    return {
        matchmakingService,
        roomManager,
        tournamentRegistry
    };
}
