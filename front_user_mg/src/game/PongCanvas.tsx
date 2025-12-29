// Pong Canvas Component
import React, { useRef, useEffect } from 'react';
import type { GameState } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_RADIUS } from './types';

interface PongCanvasProps {
    gameState: GameState | null;
}

export const PongCanvas: React.FC<PongCanvasProps> = ({ gameState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !gameState) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw center line
        ctx.strokeStyle = '#fff';
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2, 0);
        ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw paddles
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, gameState.left.y, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, gameState.right.y, PADDLE_WIDTH, PADDLE_HEIGHT);

        // Draw ball
        ctx.beginPath();
        ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Draw scores
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(gameState.score.left.toString(), CANVAS_WIDTH / 4, 60);
        ctx.fillText(gameState.score.right.toString(), (CANVAS_WIDTH * 3) / 4, 60);

    }, [gameState]);

    return (
        <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-2 border-gray-400"
        />
    );
};
