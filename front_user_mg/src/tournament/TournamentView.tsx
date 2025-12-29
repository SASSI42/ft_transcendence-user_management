// Tournament View Component
import React, { useState, useEffect } from 'react';
import type { TournamentState } from './types';
import { TournamentLobby } from './TournamentLobby';
import { socketService } from '../services/socket';

type ViewMode = 'list' | 'create' | 'lobby';

export const TournamentView: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [tournaments, setTournaments] = useState<TournamentState[]>([]);
    const [selectedTournament, setSelectedTournament] = useState<TournamentState | null>(null);
    const [createForm, setCreateForm] = useState({
        name: '',
        alias: '',
        capacity: 4
    });

    useEffect(() => {
        const socket = socketService.socket;
        if (!socket) return;

        const handleTournamentCreated = (data: { code: string; state: TournamentState }) => {
            setSelectedTournament(data.state);
            setViewMode('lobby');
        };

        const handleTournamentJoined = (data: { code: string; state: TournamentState }) => {
            setSelectedTournament(data.state);
            setViewMode('lobby');
        };

        const handleTournamentUpdate = (data: { code: string; state: TournamentState }) => {
            setTournaments(prev => 
                prev.map(t => t.code === data.code ? data.state : t)
            );
            if (selectedTournament?.code === data.code) {
                setSelectedTournament(data.state);
            }
        };

        const handleTournamentList = (list: TournamentState[]) => {
            setTournaments(list);
        };

        const handleTournamentFinished = (data: { code: string; champion: any }) => {
            alert(`Tournament ${data.code} finished! Champion: ${data.champion?.alias}`);
        };

        socket.on('server:tournament:created', handleTournamentCreated);
        socket.on('server:tournament:joined', handleTournamentJoined);
        socket.on('tournament:update', handleTournamentUpdate);
        socket.on('server:tournament:list', handleTournamentList);
        socket.on('tournament:finished', handleTournamentFinished);

        // Request list on mount
        socket.emit('client:tournament:list');

        return () => {
            socket.off('server:tournament:created', handleTournamentCreated);
            socket.off('server:tournament:joined', handleTournamentJoined);
            socket.off('tournament:update', handleTournamentUpdate);
            socket.off('server:tournament:list', handleTournamentList);
            socket.off('tournament:finished', handleTournamentFinished);
        };
    }, [selectedTournament]);

    const handleCreateTournament = () => {
        if (!createForm.name.trim() || !createForm.alias.trim()) {
            alert('Please fill in all fields');
            return;
        }

        socketService.socket?.emit('client:tournament:create', {
            name: createForm.name.trim(),
            alias: createForm.alias.trim(),
            capacity: createForm.capacity
        });
    };

    const handleJoinTournament = (tournament: TournamentState) => {
        setSelectedTournament(tournament);
        setViewMode('lobby');
    };

    const refreshList = () => {
        socketService.socket?.emit('client:tournament:list');
    };

    if (viewMode === 'lobby') {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8">
                <TournamentLobby
                    tournament={selectedTournament}
                    onBack={() => {
                        setViewMode('list');
                        setSelectedTournament(null);
                        refreshList();
                    }}
                />
            </div>
        );
    }

    if (viewMode === 'create') {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8">
                <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6">
                    <h2 className="text-2xl font-bold mb-6">Create Tournament</h2>
                    
                    <div className="mb-4">
                        <label className="block mb-2">Tournament Name</label>
                        <input
                            type="text"
                            value={createForm.name}
                            onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                            className="w-full px-4 py-2 bg-gray-700 rounded text-white"
                            placeholder="Epic Pong Tournament"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2">Your Alias</label>
                        <input
                            type="text"
                            value={createForm.alias}
                            onChange={(e) => setCreateForm({...createForm, alias: e.target.value})}
                            className="w-full px-4 py-2 bg-gray-700 rounded text-white"
                            placeholder="PongMaster"
                            maxLength={20}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block mb-2">Capacity</label>
                        <select
                            value={createForm.capacity}
                            onChange={(e) => setCreateForm({...createForm, capacity: parseInt(e.target.value)})}
                            className="w-full px-4 py-2 bg-gray-700 rounded text-white"
                        >
                            <option value={2}>2 Players</option>
                            <option value={4}>4 Players</option>
                            <option value={8}>8 Players</option>
                            <option value={16}>16 Players</option>
                        </select>
                    </div>

                    <button
                        onClick={handleCreateTournament}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded mb-2"
                    >
                        Create Tournament
                    </button>

                    <button
                        onClick={() => setViewMode('list')}
                        className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-bold">Tournaments</h1>
                    <div>
                        <button
                            onClick={refreshList}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded mr-2"
                        >
                            Refresh
                        </button>
                        <button
                            onClick={() => setViewMode('create')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                        >
                            Create Tournament
                        </button>
                    </div>
                </div>

                {tournaments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-800 rounded-lg">
                        <p className="text-gray-400 mb-4">No active tournaments</p>
                        <button
                            onClick={() => setViewMode('create')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
                        >
                            Create First Tournament
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {tournaments.map(tournament => (
                            <div
                                key={tournament.code}
                                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 cursor-pointer"
                                onClick={() => handleJoinTournament(tournament)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold">{tournament.name}</h3>
                                        <p className="text-gray-400">Code: {tournament.code}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${
                                            tournament.status === 'waiting' ? 'text-green-400' :
                                            tournament.status === 'in_progress' ? 'text-yellow-400' :
                                            'text-gray-400'
                                        }`}>
                                            {tournament.status}
                                        </p>
                                        <p className="text-gray-400">
                                            {tournament.participants.length}/{tournament.capacity} players
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
