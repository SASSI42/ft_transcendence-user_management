import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuth } from '../authContext';
// import { useAuthStore } from '../../store/useAuthStore';
import { socketService } from '../../services/socket';
import { MessageBubble } from './MessageBubble';
import { api } from '../../services/api';
import { ChallengeIcon, RemoveFriendIcon, BlockUserIcon, SendIcon } from '../icons';

const MAX_MESSAGE_LENGTH = 2000;
const SYSTEM_ID = -1;
export const ChatWindow: React.FC = () => {
  // 1. ALL HOOKS MUST BE AT THE TOP
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { friends, blockedUsers, selectedFriendId, messages, setMessages, setFriends, userStatuses } = useChatStore();
  // const currentUser = useAuthStore((state) => state.currentUser);
  const { user: currentUser } = useAuth(); // <--- Get user from Context
  
  // Logic to determine System vs Real User
  const isSystem = selectedFriendId === SYSTEM_ID;
  let selectedFriend: any = null;
  
  if (isSystem) {
      selectedFriend = { id: SYSTEM_ID, username: 'System', avatarUrl: 'https://ui-avatars.com/api/?name=System&background=000&color=fff' };
  } else {
      selectedFriend = friends.find((f) => f.id === selectedFriendId) 
                    || blockedUsers.find((f) => f.id === selectedFriendId);
  }


  const getStatusConfig = (status: string) => {
      switch (status) {
          case 'online': 
              return { color: 'text-online', dot: 'bg-online', text: 'Online' };
          case 'in-game': 
              return { color: 'text-accent', dot: 'bg-accent', text: 'Playing Pong' };
          default: 
              return { color: 'text-secondary', dot: 'bg-secondary', text: 'Offline' };
      }
  };

  // Helper variables
  const currentMessages = selectedFriendId ? (messages[selectedFriendId] || []) : [];
  const currentStatus = !isSystem && selectedFriend ? (userStatuses[selectedFriend.id] || 'offline') : 'offline';
  const statusUI = getStatusConfig(currentStatus);
  const isOnline = !isSystem && currentStatus === 'online';
  const isBlocked = !isSystem && selectedFriend && blockedUsers.some(u => u.id === selectedFriendId);

  // 2. USE EFFECTS
  useEffect(() => { 
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [currentMessages]);

  useEffect(() => {
    if (selectedFriendId && currentUser) {
        // 1. Fetch History (Only when changing friends)
        api.get(`/messages/history/${currentUser.id}/${selectedFriendId}`)
           .then(res => setMessages(selectedFriendId, res.data))
           .catch(err => console.error("Failed to load history", err));
    }
  }, [selectedFriendId, currentUser]); 

  // 🛠️ FIX: Separate Effect for Marking Read
  // This runs when you open the chat OR when a new message arrives in this chat
  useEffect(() => {
    if (selectedFriendId && currentUser && !isSystem) {
        // Only mark read if there are messages and the last one isn't from me
        // (Optimization: but 'read-all' is safe to call repeatedly)
        const lastMsg = currentMessages[currentMessages.length - 1];
        if (lastMsg && lastMsg.senderId !== currentUser.id) {
             socketService.markAllRead(selectedFriendId);
        } else if (currentMessages.length > 0 && currentMessages.every(m => m.read)) {
            // Optional: If we loaded history and they are unread, mark them
             socketService.markAllRead(selectedFriendId);
        }
    }
  }, [currentMessages, selectedFriendId, currentUser]); // 👈 Now listens to currentMessages!

  // 🛠️ FIX: Clear input when switching friends
  useEffect(() => {
    setInputText('');
  }, [selectedFriendId]);

  // 3. GUARD CLAUSE
  if (!selectedFriendId || !selectedFriend) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bgsecondary text-secondary">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg">Select a friend to start chatting</p>
        </div>
      </div>
    );
  }

  // 4. EVENT HANDLERS
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedFriendId || !currentUser) return;
    socketService.sendMessage(selectedFriendId, inputText);
    setInputText('');
  };

  const handleInvite = () => {
    if (selectedFriendId && isOnline) socketService.sendGameInvite(selectedFriendId);
  };

  const handleBlockAction = async () => {
    if (!selectedFriendId || !currentUser) return;
    const action = isBlocked ? 'Unblock' : 'Block';
    if (!confirm(`${action} ${selectedFriend?.username}?`)) return;

    // 🛠️ FIX: Use Socket Actions
    if (isBlocked) {
        socketService.unblockUser(selectedFriendId);
    } else {
        socketService.blockUser(selectedFriendId);
        // Note: The socket listener 'friend_blocked' will update the store, 
        // but we can close the chat immediately here for better UX.
        useChatStore.setState({ selectedFriendId: null });
    }
    // toggleBlock is no longer needed manually if socket handlers work!
  };

 const handleRemove = async () => {
    if (!selectedFriendId || !currentUser) return;
    if (!confirm(`Remove ${selectedFriend?.username} from friends?`)) return;
    try {
        socketService.removeFriend(selectedFriendId);
        setFriends(friends.filter(f => f.id !== selectedFriendId));
        useChatStore.setState(state => ({
            blockedUsers: state.blockedUsers.filter(b => b.id !== selectedFriendId)
        }));
        useChatStore.setState({ selectedFriendId: null });
    } catch (error) { alert('Failed to remove friend'); }
  };

  // 5. RENDER
  return (
    <div className="flex-1 flex flex-col h-full bg-bgsecondary relative">
      {/* Header with gradient border */}
      <div className="px-6 py-4 bg-bgsecondary border-b border-accent/20 flex justify-between items-center relative">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent"></div>
        
        {isSystem ? (
            <div className="flex items-center p-2 -ml-2">
                <img 
                  src={selectedFriend.avatarUrl} 
                  alt="System" 
                  className="w-10 h-10 rounded-full bg-secondary/20 object-cover mr-3 border-2 border-secondary"
                />
                <div>
                  <h3 className="font-bold text-primary">System</h3>
                  <p className="text-xs text-secondary">Automated Bot</p>
                </div>
            </div>
        ) : (
            <div 
              className="flex items-center cursor-pointer hover:bg-bgprimary/50 p-2 -ml-2 rounded-lg transition-colors group"
              onClick={() => window.location.href = `/profile/${selectedFriend.id}`}
              title="View Profile"
            >
                <div className="relative">
                  <img 
                    src={selectedFriend.avatarUrl || `https://ui-avatars.com/api/?name=${selectedFriend.username}`}
                    alt={selectedFriend.username}
                    className="w-10 h-10 rounded-full bg-secondary/20 object-cover mr-3 border-2 border-secondary group-hover:border-accent transition-colors"
                  />
                  {/* Online status dot */}
                  {/* {!isSystem && currentStatus === 'online' && (
                    <span className="absolute bottom-0 right-2 w-3 h-3 bg-online rounded-full border-2 border-bgsecondary">
                      <span className="absolute inset-0 bg-online rounded-full opacity-75"></span>
                    </span>
                  )} */}
                </div>
                <div>
                  <h3 className="font-bold text-primary group-hover:text-accent transition-colors">
                    {selectedFriend.username}
                  </h3>
                  <p className={`text-xs flex items-center ${statusUI.color}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${statusUI.dot}`}></span>
                    {statusUI.text}
                  </p>
                </div>
            </div>
        )}
        
        {!isSystem && (
            <div className="flex space-x-2">
                <button 
                  onClick={handleRemove} 
                  className="p-2 text-secondary hover:text-red hover:bg-red/10 rounded-lg transition-colors"
                  title="Remove Friend"
                >
                  <RemoveFriendIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleBlockAction} 
                  className={`p-2 rounded-lg transition-colors ${isBlocked ? 'text-accent hover:bg-accent/10' : 'text-secondary hover:text-red hover:bg-red/10'}`}
                  title={isBlocked ? 'Unblock User' : 'Block User'}
                >
                  <BlockUserIcon className="w-5 h-5" />
                </button>
            </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 bg-bgprimary/30">
        {currentMessages.map((msg, index) => (
          <MessageBubble key={msg.id || index} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {!isBlocked && !isSystem ? (
        <div className="p-4 bg-bgsecondary border-t border-accent/20">
            <form onSubmit={handleSend} className="flex items-center space-x-3">
              <button
                type="button" 
                onClick={handleInvite} 
                disabled={!isOnline} 
                className={`p-3 rounded-full transition-all ${isOnline ? 'bg-accent/20 text-accent hover:bg-accent/30' : 'bg-secondary/10 text-secondary/50 cursor-not-allowed'}`}
                title="Send Game Invite"
              >
                <ChallengeIcon className="w-5 h-5" />
              </button>
              <input 
                id="chat-message-input" 
                name="messageInput" 
                type="text" 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                className="flex-1 px-4 py-3 bg-bgprimary border border-secondary/20 rounded-full text-primary placeholder-secondary focus:outline-none focus:border-accent/50 transition-colors" 
                placeholder="Type a message..."
                maxLength={MAX_MESSAGE_LENGTH}
              />
              <button 
                type="submit"
                className="bg-accent text-bgprimary p-3 rounded-full hover:bg-accent/90 transition-all transform hover:scale-105"
              >
                <SendIcon className="w-5 h-5" />
              </button>

            <div className={`text-xs text-right ${
                        inputText.length >= MAX_MESSAGE_LENGTH ? 'text-red' : 'text-secondary'
                    }`}>
                        {inputText.length} / {MAX_MESSAGE_LENGTH}
            </div>
            </form>
        </div>
      ) : (
        <div className="p-4 bg-bgsecondary border-t border-accent/20 text-center">
            <p className="text-secondary text-sm italic">
                {isSystem ? 'You cannot reply to system messages.' : 'You have blocked this user.'}
            </p>
        </div>
      )}
    </div>
  );
};