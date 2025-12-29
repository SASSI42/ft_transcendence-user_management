"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoomManager = void 0;
const gameLogic_1 = require("./gameLogic");
const matchStorage_1 = require("../db/matchStorage");
const uuid_1 = require("uuid");
class GameRoomManager {
    rooms = new Map();
    socketToRoom = new Map();
    io;
    constructor(io) {
        this.io = io;
    }
    createRoom(pairing) {
        const roomId = (0, uuid_1.v4)();
        const game = new gameLogic_1.PongGame();
        const room = {
            id: roomId,
            game,
            players: new Map(),
            createdAt: Date.now(),
            status: 'waiting'
        };
        // Assign sides
        const [p1, p2] = pairing;
        const side1 = Math.random() > 0.5 ? 'left' : 'right';
        const side2 = side1 === 'left' ? 'right' : 'left';
        room.players.set(p1.socket.id, {
            socketId: p1.socket.id,
            userId: p1.userId,
            username: p1.username,
            side: side1,
            ready: false,
            connected: true,
            lastSeen: Date.now()
        });
        room.players.set(p2.socket.id, {
            socketId: p2.socket.id,
            userId: p2.userId,
            username: p2.username,
            side: side2,
            ready: false,
            connected: true,
            lastSeen: Date.now()
        });
        // Join socket room
        p1.socket.join(roomId);
        p2.socket.join(roomId);
        // Track socket to room mapping
        this.socketToRoom.set(p1.socket.id, roomId);
        this.socketToRoom.set(p2.socket.id, roomId);
        this.rooms.set(roomId, room);
        // Save to database
        const matchData = {
            id: roomId,
            status: 'waiting',
            game_type: 'pong',
            state_json: JSON.stringify(game.getState()),
            rejoin_deadline: null,
            created_at: Date.now(),
            updated_at: Date.now(),
            players: [
                {
                    match_id: roomId,
                    side: side1,
                    user_id: p1.userId,
                    ready: 0,
                    connected: 1,
                    last_seen: Date.now()
                },
                {
                    match_id: roomId,
                    side: side2,
                    user_id: p2.userId,
                    ready: 0,
                    connected: 1,
                    last_seen: Date.now()
                }
            ]
        };
        (0, matchStorage_1.saveMatch)(matchData);
        // Send match-ready event
        this.io.to(roomId).emit('server:match-ready', {
            roomId,
            players: Array.from(room.players.values()).map(p => ({
                userId: p.userId,
                username: p.username,
                side: p.side
            }))
        });
        return room;
    }
    markReady(socketId) {
        const roomId = this.socketToRoom.get(socketId);
        if (!roomId)
            return;
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const player = room.players.get(socketId);
        if (!player)
            return;
        player.ready = true;
        // Update database
        (0, matchStorage_1.updateMatch)(roomId, {
            state_json: JSON.stringify(room.game.getState()),
            updated_at: Date.now()
        });
        // Check if both ready
        const allReady = Array.from(room.players.values()).every(p => p.ready);
        if (allReady && room.status === 'waiting') {
            this.startGame(roomId);
        }
        this.io.to(roomId).emit('server:player-ready', {
            userId: player.userId
        });
    }
    startGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        room.status = 'playing';
        room.game.start();
        // Update database
        (0, matchStorage_1.updateMatch)(roomId, {
            status: 'playing',
            state_json: JSON.stringify(room.game.getState()),
            updated_at: Date.now()
        });
        this.io.to(roomId).emit('server:game-start');
        // Start game loop
        room.intervalId = setInterval(() => {
            this.gameLoop(roomId);
        }, 16); // ~60 FPS
    }
    gameLoop(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'playing') {
            if (room?.intervalId) {
                clearInterval(room.intervalId);
            }
            return;
        }
        room.game.update();
        const state = room.game.getState();
        // Broadcast state
        this.io.to(roomId).emit('server:state', state);
        // Check if game finished
        if (state.status === 'finished') {
            this.endGame(roomId);
        }
    }
    endGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        room.status = 'finished';
        if (room.intervalId) {
            clearInterval(room.intervalId);
        }
        const state = room.game.getState();
        const winner = state.winner;
        const players = Array.from(room.players.values());
        const winnerPlayer = players.find(p => p.side === winner);
        const loserPlayer = players.find(p => p.side !== winner);
        // Update database
        (0, matchStorage_1.updateMatch)(roomId, {
            status: 'finished',
            state_json: JSON.stringify(state),
            updated_at: Date.now()
        });
        this.io.to(roomId).emit('server:match-ended', {
            winner: winnerPlayer?.userId,
            loser: loserPlayer?.userId,
            score: state.score
        });
        // Cleanup after 10 seconds
        setTimeout(() => {
            this.destroyRoom(roomId);
        }, 10000);
    }
    applyInput(socketId, command) {
        const roomId = this.socketToRoom.get(socketId);
        if (!roomId)
            return;
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'playing')
            return;
        const player = room.players.get(socketId);
        if (!player)
            return;
        room.game.setInput(player.side, command);
    }
    handleDisconnect(socketId) {
        const roomId = this.socketToRoom.get(socketId);
        if (!roomId)
            return;
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const player = room.players.get(socketId);
        if (!player)
            return;
        player.connected = false;
        player.lastSeen = Date.now();
        // If game is playing, pause it
        if (room.status === 'playing') {
            room.game.pause();
            // Set rejoin deadline (30 seconds)
            const deadline = Date.now() + 30000;
            (0, matchStorage_1.updateMatch)(roomId, {
                rejoin_deadline: deadline,
                updated_at: Date.now()
            });
            this.io.to(roomId).emit('server:player-disconnected', {
                userId: player.userId,
                deadline
            });
            // Auto-forfeit after deadline
            setTimeout(() => {
                const currentRoom = this.rooms.get(roomId);
                if (currentRoom && !player.connected) {
                    // Player didn't reconnect, forfeit
                    this.forfeitPlayer(roomId, socketId);
                }
            }, 30000);
        }
        else {
            // If waiting, just cancel the match
            this.destroyRoom(roomId);
        }
    }
    forfeitPlayer(roomId, socketId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const forfeiter = room.players.get(socketId);
        if (!forfeiter)
            return;
        const players = Array.from(room.players.values());
        const winner = players.find(p => p.socketId !== socketId);
        if (winner) {
            this.io.to(roomId).emit('server:match-ended', {
                winner: winner.userId,
                loser: forfeiter.userId,
                forfeit: true
            });
        }
        (0, matchStorage_1.updateMatch)(roomId, {
            status: 'finished',
            updated_at: Date.now()
        });
        this.destroyRoom(roomId);
    }
    destroyRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        if (room.intervalId) {
            clearInterval(room.intervalId);
        }
        // Remove socket mappings
        for (const player of room.players.values()) {
            this.socketToRoom.delete(player.socketId);
        }
        this.rooms.delete(roomId);
    }
    getRoomBySocket(socketId) {
        const roomId = this.socketToRoom.get(socketId);
        return roomId ? this.rooms.get(roomId) : undefined;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
}
exports.GameRoomManager = GameRoomManager;
