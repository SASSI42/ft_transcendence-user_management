import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { CreateRoom } from './CreateRoom';
import { JoinRoom } from './JoinRoom';

export function GameMenu() {
  const navigate = useNavigate();
  const [menuTab, setMenuTab] = useState<'create' | 'join'>('create');

  return (
    <div className="min-h-screen bg-pong-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-pong-card rounded-[12px] shadow-2xl border border-white/5">
          <Header activeTab={menuTab} onTabChange={setMenuTab} />
          
          {menuTab === 'create' ? (
            <CreateRoom
              onCreateLocal1v1={(points) => {
                navigate('/game/local', { state: { pointsToWin: points } });
              }}
              onCreateLocalTournament={(points) => {
                navigate('/tournament/local', { state: { pointsToWin: points } });
              }}
              onCreateRemote1v1={() => navigate('/game/remote')}
              onCreateRemoteTournament={() => navigate('/tournament/remote')}
            />
          ) : (
            <JoinRoom
              onJoinRemote1v1={() => navigate('/game/remote')}
              onJoinRemoteTournament={(code) => navigate(`/tournament/remote?code=${code}`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
