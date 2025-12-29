import { useState } from 'react';

type GameMode = '1v1' | 'tournament';
type PointsOption = 11 | 21;

interface CreateRoomProps {
  onCreateLocal1v1: (points: PointsOption) => void;
  onCreateLocalTournament: (points: PointsOption) => void;
  onCreateRemote1v1: () => void;
  onCreateRemoteTournament: () => void;
}

export function CreateRoom({
  onCreateLocal1v1,
  onCreateLocalTournament,
  onCreateRemote1v1,
  onCreateRemoteTournament,
}: CreateRoomProps) {
  const [mode, setMode] = useState<GameMode>('1v1');
  const [isRemote, setIsRemote] = useState(false);
  const [pointsToWin, setPointsToWin] = useState<PointsOption>(11);

  const handleCreate = () => {
    if (mode === '1v1') {
      if (isRemote) {
        onCreateRemote1v1();
      } else {
        onCreateLocal1v1(pointsToWin);
      }
    } else {
      if (isRemote) {
        onCreateRemoteTournament();
      } else {
        onCreateLocalTournament(pointsToWin);
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
              1V1
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
              TOURNAMENT
              {mode === 'tournament' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-pong-teal"
                  style={{ boxShadow: '0 0 10px rgba(102, 232, 250, 0.5)' }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Game Type - Static */}
            <div>
              <label className="block text-white/70 text-sm font-oswald uppercase mb-2">
                game :
              </label>
              <div className="bg-pong-node rounded-lg px-4 py-3 text-pong-text-dark font-oswald font-bold">
                PING PONG
              </div>
            </div>

            {/* Points to Win */}
            <div>
              <label className="block text-white/70 text-sm font-oswald uppercase mb-2">
                points to win :
              </label>
              <div className="flex gap-3">
                {[11, 21].map((points) => (
                  <button
                    key={points}
                    onClick={() => setPointsToWin(points as PointsOption)}
                    className={`flex-1 rounded-lg px-4 py-3 font-oswald font-bold transition-all ${
                      pointsToWin === points
                        ? 'bg-pong-teal text-pong-text-dark'
                        : 'bg-pong-node text-pong-text-dark hover:bg-pong-teal/20'
                    }`}
                    style={
                      pointsToWin === points
                        ? { boxShadow: '0 0 15px rgba(102, 232, 250, 0.4)' }
                        : undefined
                    }
                  >
                    {points} POINTS
                  </button>
                ))}
              </div>
            </div>



            {/* Local/Remote Toggle */}
            <div>
              <label className="block text-white/70 text-sm font-oswald uppercase mb-2">
                mode :
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsRemote(false)}
                  className={`flex-1 rounded-lg px-4 py-3 font-oswald font-bold transition-all ${
                    !isRemote
                      ? 'bg-pong-teal text-pong-text-dark'
                      : 'bg-pong-node text-pong-text-dark hover:bg-pong-teal/20'
                  }`}
                  style={
                    !isRemote
                      ? { boxShadow: '0 0 15px rgba(102, 232, 250, 0.4)' }
                      : undefined
                  }
                >
                  LOCAL
                </button>
                <button
                  onClick={() => setIsRemote(true)}
                  className={`flex-1 rounded-lg px-4 py-3 font-oswald font-bold transition-all ${
                    isRemote
                      ? 'bg-pong-teal text-pong-text-dark'
                      : 'bg-pong-node text-pong-text-dark hover:bg-pong-teal/20'
                  }`}
                  style={
                    isRemote
                      ? { boxShadow: '0 0 15px rgba(102, 232, 250, 0.4)' }
                      : undefined
                  }
                >
                  REMOTE
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Info/Description */}
          <div className="bg-pong-bg/50 rounded-lg p-6 border border-gray-600/30">
            <h3 className="text-white font-oswald font-bold text-lg uppercase mb-3">
              {mode === '1v1' ? '1V1 MODE' : 'TOURNAMENT MODE'}
            </h3>
            <p className="text-white/70 font-roboto text-sm leading-relaxed">
              {mode === '1v1' ? (
                <>
                  Play a single match against {isRemote ? 'an online opponent' : 'another player'}. 
                  First player to reach {pointsToWin} points wins the match.
                </>
              ) : (
                <>
                  Create a tournament with {isRemote ? 'online players' : 'local participants'}. 
                  Winner advances through the bracket. First to {pointsToWin} points wins each match.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Create Button */}
        <div className="flex justify-center">
          <button
            onClick={handleCreate}
            className="px-16 py-4 bg-pong-teal text-pong-text-dark font-oswald font-bold text-2xl uppercase rounded-[12px] transition-all hover:brightness-110"
            style={{ boxShadow: '0 0 25px rgba(102, 232, 250, 0.6)' }}
          >
            CREATE
          </button>
        </div>
      </div>
    </div>
  );
}
