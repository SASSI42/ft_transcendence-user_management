"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoomManager = exports.GameRoom = void 0;
class GameRoom {
    id;
    players;
    gameState;
    gameLoopInterval;
    pointsToWin = 11;
    constructor(roomId, player1, player2) {
        this.id = roomId;
        this.players = new Map();
        // Assign sides
        this.players.set('left', {
            socket: player1.socket,
            userId: player1.userId,
            username: player1.username,
            side: 'left',
            ready: false
        });
        this.players.set('right', {
            socket: player2.socket,
            userId: player2.userId,
            username: player2.username,
            side: 'right',
            ready: false
        });
        // Initialize game state
        this.gameState = {
            ball: {
                position: { x: 0.5, y: 0.5 },
                velocity: { x: 0.01, y: 0.005 }
            },
            paddles: {
                left: { position: 0.5, direction: 0 },
                right: { position: 0.5, direction: 0 }
            },
            score: { left: 0, right: 0 },
            status: 'waiting',
            rally: 0
        };
        console.log(`🎮 Game room ${this.id} created: ${player1.username} vs ${player2.username}`);
    }
    getPlayerSide(userId) {
        for (const [side, player] of this.players.entries()) {
            if (player.userId === userId)
                return side;
        }
        return null;
    }
    setPlayerReady(userId) {
        const side = this.getPlayerSide(userId);
        if (side) {
            const player = this.players.get(side);
            player.ready = true;
            // Check if both players ready
            if (Array.from(this.players.values()).every(p => p.ready)) {
                this.startGame();
            }
        }
    }
    handleInput(userId, command) {
        const side = this.getPlayerSide(userId);
        if (!side || this.gameState.status !== 'playing')
            return;
        const paddle = this.gameState.paddles[side];
        if (command === 'up') {
            paddle.direction = -1;
        }
        else if (command === 'down') {
            paddle.direction = 1;
        }
        else {
            paddle.direction = 0;
        }
    }
    startGame() {
        this.gameState.status = 'playing';
        console.log(`▶️ Game ${this.id} started`);
        // Notify both players
        for (const player of this.players.values()) {
            player.socket.emit('server:match-started', { state: this.gameState });
        }
        // Start game loop at 60 FPS
        this.gameLoopInterval = setInterval(() => {
            this.updateGameState();
            this.broadcastState();
        }, 1000 / 60);
    }
    updateGameState() {
        // Update paddle positions
        for (const side of ['left', 'right']) {
            const paddle = this.gameState.paddles[side];
            paddle.position += paddle.direction * 0.02;
            paddle.position = Math.max(0.1, Math.min(0.9, paddle.position));
        }
        // Update ball position
        this.gameState.ball.position.x += this.gameState.ball.velocity.x;
        this.gameState.ball.position.y += this.gameState.ball.velocity.y;
        // Bounce off top/bottom
        if (this.gameState.ball.position.y <= 0 || this.gameState.ball.position.y >= 1) {
            this.gameState.ball.velocity.y *= -1;
            this.gameState.ball.position.y = Math.max(0, Math.min(1, this.gameState.ball.position.y));
        }
        // Paddle collision detection
        const ballSize = 0.02;
        const paddleWidth = 0.02;
        const paddleHeight = 0.2;
        // Left paddle
        if (this.gameState.ball.position.x <= paddleWidth + ballSize) {
            const leftPaddle = this.gameState.paddles.left;
            if (Math.abs(this.gameState.ball.position.y - leftPaddle.position) < paddleHeight / 2) {
                this.gameState.ball.velocity.x = Math.abs(this.gameState.ball.velocity.x);
                this.gameState.rally++;
            }
        }
        // Right paddle
        if (this.gameState.ball.position.x >= 1 - paddleWidth - ballSize) {
            const rightPaddle = this.gameState.paddles.right;
            if (Math.abs(this.gameState.ball.position.y - rightPaddle.position) < paddleHeight / 2) {
                this.gameState.ball.velocity.x = -Math.abs(this.gameState.ball.velocity.x);
                this.gameState.rally++;
            }
        }
        // Score points
        if (this.gameState.ball.position.x < 0) {
            this.gameState.score.right++;
            this.resetBall('right');
            this.checkGameEnd();
        }
        else if (this.gameState.ball.position.x > 1) {
            this.gameState.score.left++;
            this.resetBall('left');
            this.checkGameEnd();
        }
    }
    resetBall(lastScorer) {
        this.gameState.ball.position = { x: 0.5, y: 0.5 };
        this.gameState.ball.velocity = {
            x: lastScorer === 'left' ? 0.01 : -0.01,
            y: (Math.random() - 0.5) * 0.01
        };
        this.gameState.rally = 0;
    }
    checkGameEnd() {
        if (this.gameState.score.left >= this.pointsToWin || this.gameState.score.right >= this.pointsToWin) {
            this.endGame();
        }
    }
    endGame() {
        this.gameState.status = 'ended';
        const winner = this.gameState.score.left >= this.pointsToWin ? 'left' : 'right';
        console.log(`🏁 Game ${this.id} ended. Winner: ${winner}`);
        // Stop game loop
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
        }
        // Notify both players
        for (const player of this.players.values()) {
            player.socket.emit('server:match-ended', {
                roomId: this.id,
                winner,
                state: this.gameState
            });
        }
    }
    broadcastState() {
        for (const player of this.players.values()) {
            player.socket.emit('server:state', { state: this.gameState });
        }
    }
    cleanup() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
        }
        console.log(`🧹 Game room ${this.id} cleaned up`);
    }
    getState() {
        return this.gameState;
    }
    getPlayers() {
        return this.players;
    }
}
exports.GameRoom = GameRoom;
class GameRoomManager {
    rooms = new Map();
    createRoom(player1, player2) {
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const room = new GameRoom(roomId, player1, player2);
        this.rooms.set(roomId, room);
        // Notify both players they joined
        const leftPlayer = room.getPlayers().get('left');
        const rightPlayer = room.getPlayers().get('right');
        player1.socket.emit('server:joined', {
            roomId,
            side: 'left',
            state: room.getState(),
            opponent: { side: 'right', username: player2.username }
        });
        player2.socket.emit('server:joined', {
            roomId,
            side: 'right',
            state: room.getState(),
            opponent: { side: 'left', username: player1.username }
        });
        return room;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    getRoomByUserId(userId) {
        for (const room of this.rooms.values()) {
            if (room.getPlayerSide(userId) !== null) {
                return room;
            }
        }
        return undefined;
    }
    removeRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.cleanup();
            this.rooms.delete(roomId);
        }
    }
}
exports.GameRoomManager = GameRoomManager;
