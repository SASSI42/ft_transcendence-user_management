import React from 'react';
import { useChatStore } from '../../store/useChatStore';
import { socketService } from '../../services/socket';
import { ControllerIcon } from '../icons';

export const GameInviteModal: React.FC = () => {
  const incomingInvite = useChatStore((state) => state.incomingInvite);
  const setIncomingInvite = useChatStore((state) => state.setIncomingInvite);
  
  // Find sender name from friend list if possible
  // const friends = useChatStore((state) => state.friends);
  if (!incomingInvite) return null;
  const senderName = incomingInvite.senderUsername || 'System';


  const handleAccept = () => {
    socketService.acceptGameInvite(incomingInvite.id);
    setIncomingInvite(null); // Close modal immediately (Socket event will redirect)
  };

  const handleDecline = () => {
    socketService.declineGameInvite(incomingInvite.id);
    setIncomingInvite(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bgprimary/95 backdrop-blur-md">
      <div className="bg-bgsecondary border border-accent/20 rounded-2xl shadow-2xl p-8 w-96 transform transition-all scale-100 animate-pulse-slow">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
             <ControllerIcon className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-3xl font-bebas-neue text-primary tracking-wide">GAME CHALLENGE!</h2>
          <p className="text-secondary mt-3">
            <span className="font-semibold text-accent">{senderName}</span> wants to play Pong with you.
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleDecline}
            className="flex-1 px-4 py-3 border border-secondary/40 text-secondary rounded-lg hover:bg-bgprimary/50 font-medium transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-3 bg-accent text-bgprimary rounded-lg hover:bg-accent/90 font-bold shadow-md transition-transform active:scale-95"
          >
            Accept Match
          </button>
        </div>
        
        <div className="mt-4 text-center">
            <p className="text-xs text-secondary">Invite expires in 5:00</p>
        </div>
      </div>
    </div>
  );
};