import React from 'react';
import type { Message } from '../../types';
// import { useAuthStore } from '../../store/useAuthStore';
import { useAuth } from '../authContext';
import { useChatStore } from '../../store/useChatStore';
import { format } from 'date-fns';
import { socketService } from '../../services/socket';

interface Props {
  message: Message;
}

export const MessageBubble: React.FC<Props> = ({ message }) => {
  // const currentUser = useAuthStore((state) => state.currentUser);
  const { user: currentUser } = useAuth();
  
  const { friends, blockedUsers } = useChatStore();
  const isMine = message.senderId === currentUser?.id;

  // Get sender info for received messages
  const sender = !isMine 
    ? friends.find(f => f.id === message.senderId) || blockedUsers.find(f => f.id === message.senderId)
    : null;

  // 🛠️ CLEAN FIX: Rely entirely on the boolean from DB
  const isInvite = !!message.isInvite; 
  
  // We still parse the content to get the ID/Status, but ONLY if isInvite is true
  const parts = message.content.split('::');
  const inviteId = isInvite && parts.length > 1 ? parts[1] : null;
  const status = isInvite && parts.length > 2 ? parts[2] : 'PENDING';

  const handleAccept = () => { if (inviteId) socketService.acceptGameInvite(inviteId); };
  const handleDecline = () => { if (inviteId) socketService.declineGameInvite(inviteId); };

return (
    <div className={`flex w-full mb-4 ${isMine ? 'justify-end' : 'justify-start items-end'}`}>
      {/* Avatar for received messages */}
      {!isMine && sender && (
        <img
          src={sender.avatarUrl || `https://ui-avatars.com/api/?name=${sender.username}`}
          alt={sender.username}
          className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
        />
      )}
      
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
          isMine 
            ? 'bg-primary text-bgprimary rounded-br-sm' 
            : 'bg-bgprimary/50 text-primary rounded-bl-sm border border-secondary/20'
        }`}
      >
        {isInvite ? (
          /* ✅ RENDER INVITE UI (Existing code moved here) */
          <div className="flex flex-col items-center p-2 w-48">
            <div className="text-3xl mb-2">🏓</div>
            <p className="font-bold mb-1 text-center">Game Invite</p>
            
            {status !== 'PENDING' ? (
                <p className="text-sm uppercase font-bold opacity-70 tracking-wide">
                    {status}
                </p>
            ) : (
                <>
                    {!isMine ? (
                    <div className="flex space-x-2 w-full mt-2">
                        <button onClick={handleDecline} className={`flex-1 px-2 py-1 rounded text-xs hover:opacity-80 transition ${isMine ? 'bg-bgprimary/20 text-bgprimary' : 'bg-secondary/20 text-primary'}`}>Decline</button>
                        <button onClick={handleAccept} className={`flex-1 px-2 py-1 rounded text-xs hover:opacity-80 transition font-bold ${isMine ? 'bg-accent/20 text-bgprimary' : 'bg-accent text-bgprimary'}`}>Accept</button>
                    </div>
                    ) : (
                    <p className="text-xs opacity-75 italic mt-1">Waiting...</p>
                    )}
                </>
            )}
          </div>
        ) : (
            /* ✅ RENDER PLAIN TEXT (New Fallback) */
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-all">{message.content}</p>
        )}

        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMine ? 'text-bgprimary/60' : 'text-secondary'}`}>
          <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
        </div>
      </div>
    </div>
  );
}
