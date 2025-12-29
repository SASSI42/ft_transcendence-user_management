// Game Type Definitions
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

export interface PlayerInfo {
    userId: number;
    username: string;
    side: 'left' | 'right';
}

export interface MatchResult {
    winner: number;
    loser: number;
    score: {
        left: number;
        right: number;
    };
    forfeit?: boolean;
}

export type InputCommand = 'up' | 'down' | 'stop';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 100;
export const BALL_RADIUS = 5;
