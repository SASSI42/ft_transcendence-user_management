import { useState } from 'react';
import { Search } from 'lucide-react';

interface JoinRoomProps {
  onJoinRemote1v1: () => void;
  onJoinRemoteTournament: (code: string) => void;
}

export function JoinRoom({ onJoinRemote1v1, onJoinRemoteTournament }: JoinRoomProps) {
  const [mode, setMode] = useState<'1v1' | 'tournament'>('1v1');
  const [tournamentCode, setTournamentCode] = useState('');

  const handleJoin = () => {
    if (mode === '1v1') {
      onJoinRemote1v1();
    } else {
      if (tournamentCode.trim()) {
        onJoinRemoteTournament(tournamentCode.trim().toUpperCase());
      }
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Mode Selector */}
        <div className="mb-8">
          <div className="flex gap-8 border-b border-gray-600/30">
            <button
              onClick={() => setMode('1v1')}
              className={`px-6 py-3 font-oswald font-bold text-xl uppercase transition-all relative ${
                mode === '1v1' ? 'text-pong-teal' : 'text-white/60 hover:text-white'
              }`}
            >
              REMOTE 1V1
              {mode === '1v1' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-pong-teal"
                  style={{ boxShadow: '0 0 10px rgba(102, 232, 250, 0.5)' }}
                />
              )}
            </button>
            <button
              onClick={() => setMode('tournament')}
              className={`px-6 py-3 font-oswald font-bold text-xl uppercase transition-all relative ${
                mode === 'tournament' ? 'text-pong-teal' : 'text-white/60 hover:text-white'
              }`}
            >
              REMOTE TOURNAMENT
              {mode === 'tournament' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-pong-teal"
                  style={{ boxShadow: '0 0 10px rgba(102, 232, 250, 0.5)' }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Join Section */}
        <div className="max-w-2xl mx-auto">
          {mode === '1v1' && (
            <div className="bg-pong-bg/50 rounded-lg p-8 border border-gray-600/30">
              <div className="text-center mb-6">
                <h2 className="text-white font-oswald font-bold text-3xl uppercase mb-3">
                  MATCHMAKING
                </h2>
                <p className="text-white/70 font-roboto">
                  Join the matchmaking queue to find an opponent for a 1v1 match
                </p>
              </div>

              <button
                onClick={handleJoin}
                className="w-full px-8 py-4 bg-pong-teal text-pong-text-dark font-oswald font-bold text-xl uppercase rounded-[12px] transition-all hover:brightness-110"
                style={{ boxShadow: '0 0 20px rgba(102, 232, 250, 0.5)' }}
              >
                FIND MATCH
              </button>

              <div className="mt-6 pt-6 border-t border-gray-600/30">
                <p className="text-white/50 text-sm font-roboto text-center">
                  You will be automatically matched with an available player
                </p>
              </div>
            </div>
          )}

          {mode === 'tournament' && (
            <div className="bg-pong-bg/50 rounded-lg p-8 border border-gray-600/30">
              <div className="text-center mb-6">
                <h2 className="text-white font-oswald font-bold text-3xl uppercase mb-3">
                  JOIN TOURNAMENT
                </h2>
                <p className="text-white/70 font-roboto">
                  Enter the tournament code to join an existing tournament
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-white/70 text-sm font-oswald uppercase mb-2">
                  TOURNAMENT CODE
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pong-text-dark/40" />
                  <input
                    type="text"
                    value={tournamentCode}
                    onChange={(e) => setTournamentCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="w-full rounded-lg px-12 py-4 text-pong-text-dark font-oswald font-bold text-lg placeholder-bgprimary/40 uppercase input-field"
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                onClick={handleJoin}
                disabled={!tournamentCode.trim()}
                className={`w-full px-8 py-4 font-oswald font-bold text-xl uppercase rounded-[12px] transition-all ${
                  tournamentCode.trim()
                    ? 'bg-pong-teal text-pong-text-dark hover:brightness-110'
                    : 'bg-pong-node/20 text-white/30 cursor-not-allowed'
                }`}
                style={
                  tournamentCode.trim()
                    ? { boxShadow: '0 0 20px rgba(102, 232, 250, 0.5)' }
                    : undefined
                }
              >
                JOIN TOURNAMENT
              </button>

              <div className="mt-6 pt-6 border-t border-gray-600/30">
                <p className="text-white/50 text-sm font-roboto text-center">
                  Ask the tournament organizer for the tournament code
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-pong-teal/10 rounded-lg p-4 border border-pong-teal/30">
            <p className="text-pong-teal/90 text-sm font-roboto text-center">
              ℹ️ Public room browsing is not available. Use matchmaking for 1v1 or enter a tournament code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
