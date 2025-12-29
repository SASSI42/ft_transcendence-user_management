"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeGameServices = initializeGameServices;
exports.registerGameHandlers = registerGameHandlers;
exports.getGameServices = getGameServices;
const gameRoom_1 = require("../game/gameRoom");
const matchmaking_1 = require("../game/matchmaking");
const registry_1 = require("../tournament/registry");
// Global instances (should be passed from main handler or created as singletons)
let matchmakingService;
let roomManager;
let tournamentRegistry;
function initializeGameServices(io) {
    matchmakingService = new matchmaking_1.MatchmakingService();
    roomManager = new gameRoom_1.GameRoomManager(io);
    tournamentRegistry = new registry_1.TournamentRegistry(io, roomManager);
}
function registerGameHandlers(io, socket, userId, username) {
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
    socket.on('client:input', (payload) => {
        if (!payload.command)
            return;
        roomManager.applyInput(socket.id, payload.command);
    });
    // Mark ready for game start
    socket.on('client:ready', () => {
        roomManager.markReady(socket.id);
    });
    // Tournament: Create
    socket.on('client:tournament:create', (payload) => {
        if (!payload.name || !payload.alias || !payload.capacity) {
            socket.emit('server:error', { message: 'Missing required fields' });
            return;
        }
        const tournament = tournamentRegistry.createTournament(payload.name, payload.capacity, userId, payload.alias);
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
    socket.on('client:tournament:join', (payload) => {
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
    socket.on('client:tournament:leave', (payload) => {
        if (!payload.code)
            return;
        tournamentRegistry.leaveTournament(payload.code, userId);
    });
    // Tournament: Start
    socket.on('client:tournament:start', (payload) => {
        if (!payload.code)
            return;
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
function getGameServices() {
    return {
        matchmakingService,
        roomManager,
        tournamentRegistry
    };
}
