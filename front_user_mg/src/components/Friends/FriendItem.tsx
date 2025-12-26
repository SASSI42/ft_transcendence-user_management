import React from 'react';
import type { Friend } from '../../types';
import { useChatStore } from '../../store/useChatStore';

interface Props {
  friend: Friend;
}

export const FriendItem: React.FC<Props> = ({ friend }) => {
  const selectFriend = useChatStore((state) => state.selectFriend);
  const selectedFriendId = useChatStore((state) => state.selectedFriendId);
  const unreadCount = useChatStore((state) => state.unreadCounts[friend.id] || 0);

  const isSelected = selectedFriendId === friend.id;

  return (
    <div
      onClick={() => selectFriend(friend.id)}
      className={`flex items-center p-3 cursor-pointer hover:bg-bgprimary/50 transition-colors border-b border-secondary/10 ${
        isSelected ? 'bg-accent/10 border-r-4 border-accent' : ''
      }`}
    >
      {/* Avatar & Status */}
      <div className="relative">
        <img
          src={friend.avatarUrl || `https://ui-avatars.com/api/?name=${friend.username}`}
          alt={friend.username}
          className="w-10 h-10 rounded-full bg-secondary/20 border-2 border-secondary"
        />
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-bgsecondary ${
            friend.status === 'online' ? 'bg-online' : 
            friend.status === 'in-game' ? 'bg-accent' : 'bg-secondary'
          }`}
        >
          {friend.status === 'online' && (
            <span className="absolute inset-0 bg-online rounded-full opacity-75"></span>
          )}
        </span>
      </div>

      {/* Info */}
      <div className="ml-3 flex-1 overflow-hidden">
        <h4 className="font-medium text-primary truncate">{friend.username}</h4>
        <p className="text-xs text-secondary truncate">
          {friend.status === 'online' ? 'Online' : friend.status === 'in-game' ? 'Playing Pong' : 'Offline'}
        </p>
      </div>

      {/* Notifications */}
      <div className="flex items-center space-x-2">
        {unreadCount > 0 && (
          <span className="bg-accent text-bgprimary text-xs font-bold px-2 py-0.5 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
    </div>
  );
};