import { Gamepad2 } from 'lucide-react';

interface HeaderProps {
  activeTab: 'create' | 'join';
  onTabChange: (tab: 'create' | 'join') => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="border-b border-gray-600/30">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left side - Logo */}
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-pong-teal" />
          <span className="text-2xl font-oswald font-bold text-white uppercase">
            GAME
          </span>
        </div>

        {/* Right side - Navigation buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onTabChange('create')}
            className={`px-6 py-2 rounded-lg font-oswald font-bold uppercase transition-all ${
              activeTab === 'create'
                ? 'bg-pong-teal text-pong-text-dark shadow-lg'
                : 'text-white hover:text-pong-teal'
            }`}
            style={
              activeTab === 'create'
                ? { boxShadow: '0 0 20px rgba(102, 232, 250, 0.5)' }
                : undefined
            }
          >
            CREATE ROOM
          </button>
          <button
            onClick={() => onTabChange('join')}
            className={`px-6 py-2 rounded-lg font-oswald font-bold uppercase transition-all ${
              activeTab === 'join'
                ? 'bg-pong-teal text-pong-text-dark shadow-lg'
                : 'text-white hover:text-pong-teal'
            }`}
            style={
              activeTab === 'join'
                ? { boxShadow: '0 0 20px rgba(102, 232, 250, 0.5)' }
                : undefined
            }
          >
            JOIN ROOM
          </button>
        </div>
      </div>
    </header>
  );
}
