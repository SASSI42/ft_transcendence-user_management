// Main Pong Game Component
import React, { useState, useEffect, useCallback } from 'react';
import { PongCanvas } from './PongCanvas';
import type { GameState, PlayerInfo, MatchResult, InputCommand } from './types';
import { socketService } from '../services/socket';

type GamePhase = 'idle' | 'queue' | 'matched' | 'ready' | 'playing' | 'finished';

export const PongGame: React.FC = () => {
    const [phase, setPhase] = useState<GamePhase>('idle');
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [players, setPlayers] = useState<PlayerInfo[]>([]);
    const [queuePosition, setQueuePosition] = useState<number>(0);
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Ensure socket is connected when component mounts
    useEffect(() => {
        socketService.connect();
    }, []);

    // Handle keyboard input
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (phase !== 'playing') return;

        let command: InputCommand | null = null;
        if (e.key === 'ArrowUp' || e.key === 'w') {
            command = 'up';
        } else if (e.key === 'ArrowDown' || e.key === 's') {
            command = 'down';
        }

        if (command) {
            socketService.socket?.emit('client:input', { command });
        }
    }, [phase]);

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        if (phase !== 'playing') return;

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'w' || e.key === 's') {
            socketService.socket?.emit('client:input', { command: 'stop' });
        }
    }, [phase]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    // Socket event listeners
    useEffect(() => {
        const socket = socketService.socket;
        if (!socket) return;

        const handleQueue = (data: { status: string; position?: number; roomId?: string }) => {
            if (data.status === 'waiting') {
                setPhase('queue');
                setQueuePosition(data.position || 0);
            } else if (data.status === 'matched') {
                setPhase('matched');
            } else if (data.status === 'left') {
                setPhase('idle');
            }
        };

        const handleMatchReady = (data: { roomId: string; players: PlayerInfo[] }) => {
            setPhase('ready');
            setPlayers(data.players);
        };

        const handleGameStart = () => {
            setPhase('playing');
        };

        const handleState = (state: GameState) => {
            setGameState(state);
        };

        const handleMatchEnded = (result: MatchResult) => {
            setPhase('finished');
            setMatchResult(result);
            socketService.socket?.emit('game_finished');
        };

        const handlePlayerReady = () => {
            // Could show which players are ready
        };

        const handlePlayerDisconnected = () => {
            alert(`Player disconnected! Waiting for reconnection...`);
        };

        socket.on('server:queue', handleQueue);
        socket.on('server:match-ready', handleMatchReady);
        socket.on('server:game-start', handleGameStart);
        socket.on('server:state', handleState);
        socket.on('server:match-ended', handleMatchEnded);
        socket.on('server:player-ready', handlePlayerReady);
        socket.on('server:player-disconnected', handlePlayerDisconnected);

        return () => {
            socket.off('server:queue', handleQueue);
            socket.off('server:match-ready', handleMatchReady);
            socket.off('server:game-start', handleGameStart);
            socket.off('server:state', handleState);
            socket.off('server:match-ended', handleMatchEnded);
            socket.off('server:player-ready', handlePlayerReady);
            socket.off('server:player-disconnected', handlePlayerDisconnected);
        };
    }, []);

    const joinQueue = () => {
        socketService.socket?.emit('client:join');
    };

    const leaveQueue = () => {
        socketService.socket?.emit('client:leave-queue');
        setPhase('idle');
    };

    const markReady = () => {
        socketService.socket?.emit('client:ready');
        setIsReady(true);
    };

    const playAgain = () => {
        setPhase('idle');
        setGameState(null);
        setPlayers([]);
        setMatchResult(null);
        setIsReady(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-4xl font-bold mb-8">Pong Game</h1>

            {phase === 'idle' && (
                <div className="text-center">
                    <p className="mb-4">Ready to play?</p>
                    <button
                        onClick={joinQueue}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold"
                    >
                        Join Queue
                    </button>
                </div>
            )}

            {phase === 'queue' && (
                <div className="text-center">
                    <p className="mb-4">Searching for opponent...</p>
                    <p className="text-gray-400">Position in queue: {queuePosition}</p>
                    <button
                        onClick={leaveQueue}
                        className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg"
                    >
                        Leave Queue
                    </button>
                </div>
            )}

            {phase === 'matched' && (
                <div className="text-center">
                    <p className="mb-4">Match found! Preparing game...</p>
                </div>
            )}

            {phase === 'ready' && (
                <div className="text-center">
                    <p className="mb-4">Match Ready!</p>
                    <div className="mb-4">
                        {players.map(p => (
                            <p key={p.userId}>
                                {p.username} ({p.side})
                            </p>
                        ))}
                    </div>
                    {!isReady ? (
                        <button
                            onClick={markReady}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg"
                        >
                            Ready!
                        </button>
                    ) : (
                        <p className="text-yellow-400">Waiting for opponent...</p>
                    )}
                </div>
            )}

            {phase === 'playing' && (
                <div className="text-center">
                    <div className="mb-4">
                        <PongCanvas gameState={gameState} />
                    </div>
                    <p className="text-gray-400 mt-4">Use Arrow Keys or W/S to move</p>
                </div>
            )}

            {phase === 'finished' && matchResult && (
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
                    {matchResult.forfeit ? (
                        <p className="mb-4">Player forfeited</p>
                    ) : (
                        <div className="mb-4">
                            <p>Final Score: {matchResult.score.left} - {matchResult.score.right}</p>
                        </div>
                    )}
                    <button
                        onClick={playAgain}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                        Play Again
                    </button>
                </div>
            )}
        </div>
    );
};
