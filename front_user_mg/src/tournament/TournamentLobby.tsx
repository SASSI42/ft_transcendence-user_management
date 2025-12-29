// Tournament Lobby Component
import React, { useState } from 'react';
import type { TournamentState } from './types';
import { socketService } from '../services/socket';

interface TournamentLobbyProps {
    tournament: TournamentState | null;
    onBack: () => void;
}

export const TournamentLobby: React.FC<TournamentLobbyProps> = ({ tournament, onBack }) => {
    const [alias, setAlias] = useState('');

    if (!tournament) {
        return (
            <div className="text-center">
                <p className="mb-4">No tournament selected</p>
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                >
                    Back
                </button>
            </div>
        );
    }

    const handleJoin = () => {
        if (!alias.trim()) {
            alert('Please enter an alias');
            return;
        }
        socketService.socket?.emit('client:tournament:join', {
            code: tournament.code,
            alias: alias.trim()
        });
    };

    const handleLeave = () => {
        socketService.socket?.emit('client:tournament:leave', {
            code: tournament.code
        });
    };

    const handleStart = () => {
        socketService.socket?.emit('client:tournament:start', {
            code: tournament.code
        });
    };

    const isInTournament = tournament.participants.some(p => p.user_id === getCurrentUserId());
    const canStart = tournament.participants.length >= 2 && tournament.status === 'waiting';

    return (
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg p-6">
            <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">{tournament.name}</h2>
                <p className="text-gray-400">Code: {tournament.code}</p>
                <p className="text-gray-400">
                    Status: {tournament.status} | Participants: {tournament.participants.length}/{tournament.capacity}
                </p>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Participants</h3>
                <div className="grid grid-cols-2 gap-2">
                    {tournament.participants.map(p => (
                        <div key={p.user_id} className="bg-gray-700 p-3 rounded">
                            <p className="font-semibold">{p.alias}</p>
                            {p.eliminated && <span className="text-red-400 text-sm">Eliminated</span>}
                            {p.placement && <span className="text-yellow-400 text-sm">Place: {p.placement}</span>}
                        </div>
                    ))}
                </div>
            </div>

            {tournament.status === 'waiting' && !isInTournament && (
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Enter your alias"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 rounded mb-2 text-white"
                        maxLength={20}
                    />
                    <button
                        onClick={handleJoin}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
                    >
                        Join Tournament
                    </button>
                </div>
            )}

            {tournament.status === 'waiting' && isInTournament && (
                <div className="mb-6">
                    <button
                        onClick={handleLeave}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded mb-2"
                    >
                        Leave Tournament
                    </button>
                    {canStart && (
                        <button
                            onClick={handleStart}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                        >
                            Start Tournament
                        </button>
                    )}
                </div>
            )}

            {tournament.status === 'in_progress' && (
                <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3">Bracket</h3>
                    <div className="text-gray-400">
                        <p>Current Round: {tournament.currentRound}</p>
                        {/* Bracket visualization would go here */}
                    </div>
                </div>
            )}

            {tournament.status === 'finished' && (
                <div className="mb-6 text-center">
                    <h3 className="text-2xl font-bold text-yellow-400">Tournament Complete!</h3>
                    {tournament.participants.find(p => p.placement === 1) && (
                        <p className="text-xl mt-2">
                            Champion: {tournament.participants.find(p => p.placement === 1)?.alias}
                        </p>
                    )}
                </div>
            )}

            <button
                onClick={onBack}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
            >
                Back to Tournaments
            </button>
        </div>
    );
};

// Helper function to get current user ID (should match your auth system)
function getCurrentUserId(): number {
    const token = localStorage.getItem('authToken');
    if (!token) return -1;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.id;
    } catch {
        return -1;
    }
}
