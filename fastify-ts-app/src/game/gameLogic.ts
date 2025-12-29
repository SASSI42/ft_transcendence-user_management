// Core Pong Game Logic
export type InputCommand = 'up' | 'down' | 'stop';

export interface PaddleState {
    y: number;
    velocity: number;
}

export interface BallState {
    x: number;
    y: number;
    vx: number;
    vy: number;
}

export interface GameState {
    left: PaddleState;
    right: PaddleState;
    ball: BallState;
    score: {
        left: number;
        right: number;
    };
    status: 'waiting' | 'playing' | 'paused' | 'finished';
    winner?: 'left' | 'right';
}

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 5;
const BALL_RADIUS = 5;
const BALL_INITIAL_SPEED = 4;
const MAX_SCORE = 5;

export class PongGame {
    state: GameState;

    constructor() {
        this.state = this.createInitialState();
    }

    private createInitialState(): GameState {
        return {
            left: { y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, velocity: 0 },
            right: { y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, velocity: 0 },
            ball: this.resetBall(),
            score: { left: 0, right: 0 },
            status: 'waiting'
        };
    }

    private resetBall(toLeft: boolean = Math.random() > 0.5): BallState {
        const angle = (Math.random() - 0.5) * Math.PI / 3; // -30 to +30 degrees
        return {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
            vx: BALL_INITIAL_SPEED * Math.cos(angle) * (toLeft ? -1 : 1),
            vy: BALL_INITIAL_SPEED * Math.sin(angle)
        };
    }

    setInput(side: 'left' | 'right', command: InputCommand) {
        const paddle = this.state[side];
        switch (command) {
            case 'up':
                paddle.velocity = -PADDLE_SPEED;
                break;
            case 'down':
                paddle.velocity = PADDLE_SPEED;
                break;
            case 'stop':
                paddle.velocity = 0;
                break;
        }
    }

    update(deltaTime: number = 16) {
        if (this.state.status !== 'playing') return;

        // Normalize deltaTime to 60 FPS baseline (16.67ms per frame)
        const timeScale = deltaTime / 16.67;

        // Update paddles
        this.updatePaddle(this.state.left, timeScale);
        this.updatePaddle(this.state.right, timeScale);

        // Update ball
        this.updateBall(timeScale);

        // Check for scoring
        this.checkScoring();
    }

    private updatePaddle(paddle: PaddleState, timeScale: number) {
        paddle.y += paddle.velocity * timeScale;
        // Clamp to canvas
        paddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle.y));
    }

    private updateBall(timeScale: number) {
        const ball = this.state.ball;
        ball.x += ball.vx * timeScale;
        ball.y += ball.vy * timeScale;

        // Top/bottom collision
        if (ball.y - BALL_RADIUS <= 0 || ball.y + BALL_RADIUS >= CANVAS_HEIGHT) {
            ball.vy = -ball.vy;
            ball.y = Math.max(BALL_RADIUS, Math.min(CANVAS_HEIGHT - BALL_RADIUS, ball.y));
        }

        // Left paddle collision
        if (ball.x - BALL_RADIUS <= PADDLE_WIDTH) {
            if (ball.y >= this.state.left.y && ball.y <= this.state.left.y + PADDLE_HEIGHT) {
                ball.vx = Math.abs(ball.vx);
                const hitPos = (ball.y - this.state.left.y - PADDLE_HEIGHT / 2) / (PADDLE_HEIGHT / 2);
                ball.vy += hitPos * 2;
            }
        }

        // Right paddle collision
        if (ball.x + BALL_RADIUS >= CANVAS_WIDTH - PADDLE_WIDTH) {
            if (ball.y >= this.state.right.y && ball.y <= this.state.right.y + PADDLE_HEIGHT) {
                ball.vx = -Math.abs(ball.vx);
                const hitPos = (ball.y - this.state.right.y - PADDLE_HEIGHT / 2) / (PADDLE_HEIGHT / 2);
                ball.vy += hitPos * 2;
            }
        }
    }

    private checkScoring() {
        const ball = this.state.ball;
        
        if (ball.x - BALL_RADIUS <= 0) {
            // Right player scores
            this.state.score.right++;
            this.state.ball = this.resetBall(false);
            if (this.state.score.right >= MAX_SCORE) {
                this.state.status = 'finished';
                this.state.winner = 'right';
            }
        } else if (ball.x + BALL_RADIUS >= CANVAS_WIDTH) {
            // Left player scores
            this.state.score.left++;
            this.state.ball = this.resetBall(true);
            if (this.state.score.left >= MAX_SCORE) {
                this.state.status = 'finished';
                this.state.winner = 'left';
            }
        }
    }

    start() {
        this.state.status = 'playing';
    }

    pause() {
        this.state.status = 'paused';
    }

    getState(): GameState {
        return JSON.parse(JSON.stringify(this.state));
    }

    static getConstants() {
        return {
            CANVAS_WIDTH,
            CANVAS_HEIGHT,
            PADDLE_WIDTH,
            PADDLE_HEIGHT,
            BALL_RADIUS
        };
    }
}
