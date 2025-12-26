import React, { useEffect, useState } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { FriendItem } from './FriendItem';
// import { useAuthStore } from '../store/useAuthStore';
import { useAuth } from '../authContext';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { SearchIcon, ChevronDownIcon, CheckIcon, CrossIcon, UsersIcon } from '../icons';


export const FriendsList: React.FC = () => {
  const { 
    friends, blockedUsers, pendingRequests, sentRequests, userStatuses, 
    setFriends, setPendingRequests, setSentRequests, setBlockedUsers, selectFriend, selectedFriendId, setUnreadCounts
  } = useChatStore();
  
  // const currentUser = useAuthStore((state) => state.currentUser);
  const { user: currentUser } = useAuth();
  const SYSTEM_ID = -1;
  
  const [showBlocked, setShowBlocked] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [addStatus, setAddStatus] = useState<string | null>(null);
  const [showPending, setShowPending] = useState(true); // Default to Open so they see new requests

const [filterText, setFilterText] = useState('');
const [isSearching, setIsSearching] = useState(false); // 🛠️ NEW: State to block double-clicks
useEffect(() => {
    if (!currentUser) return;
    const fetchInitialData = async () => {
        try {
            const [friendsRes, pendingRes, sentRes, blockedRes, unreadRes] = await Promise.all([
                api.get(`/friends/${currentUser.id}`),
                api.get(`/friends/${currentUser.id}/pending`),
                api.get(`/friends/${currentUser.id}/sent`),
                api.get(`/friends/${currentUser.id}/blocked`),
                api.get(`/messages/unread/${currentUser.id}`)
            ]);

            setFriends(friendsRes.data);
            setPendingRequests(pendingRes.data);
            setSentRequests(sentRes.data);
            setBlockedUsers(blockedRes.data);
            setUnreadCounts(unreadRes.data);
            
            socketService.requestOnlineFriends();
        } catch (error) { console.error('Error fetching data:', error); }
    };
    fetchInitialData();
  }, [currentUser]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearching) return; // Prevent multiple submissions
    setIsSearching(true);
    setAddStatus('Searching...');
    try {
      // 1. Search via API (Read-only is fine via HTTP)
        const userRes = await api.get(`/friends/find/${addUsername}?t=${Date.now()}`);
        console.log("🔍 Search Result:", userRes.data); // <--- ADD THIS
        const { id: friendId, username, relation } = userRes.data;

        if (friendId === currentUser?.id) {
            setAddStatus('You cannot add yourself.');
            return;
        }

        // 2. 🛠️ FIX: Check relationship BEFORE sending socket event
        if (relation === 'friends') {
            setAddStatus(`You are already friends with ${username}.`);
            return;
        }
        if (relation === 'pending_sent') {
            setAddStatus(`Friend request already sent to ${username}.`);
            return;
        }

        socketService.sendFriendRequest(friendId);
        setAddStatus(`Friend request sent to ${username}!`);
      
        setAddUsername('');
    } catch (error: any) {
        setAddStatus(error.response?.data?.error || 'User not found or request failed.');
    } finally {
        setIsSearching(false); // 🛡️ Re-enable button
    }
  };

  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(filterText.toLowerCase())
  );

  const acceptRequest = (id: string, friendId: number) => {
    socketService.acceptFriendRequest(id, friendId);
  };

  const declineRequest = (id: string) => {
    socketService.declineFriendRequest(id);
  };


  const systemBot = {
    id: SYSTEM_ID,
    username: 'System',
    avatarUrl: 'https://ui-avatars.com/api/?name=System&background=000&color=fff', // Black icon
    status: 'online' // Dummy status (won't be shown)
  };

return (
    <div className="w-80 border-r border-accent/20 bg-bgsecondary flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-accent/20 bg-bgsecondary/80 flex justify-between items-center relative">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent"></div>
        <h2 className="text-xl font-bebas-neue tracking-wide text-primary flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-accent" />
          FRIENDS
        </h2>
        <button 
            onClick={() => setShowAddFriend(!showAddFriend)}
            className="bg-accent text-bgprimary px-3 py-1 rounded-full text-sm font-medium hover:bg-accent/90 transition-all transform hover:scale-105"
        >
            {showAddFriend ? '✕' : '+ Add'}
        </button>
      </div>

      {/* Add Friend Form */}
      {showAddFriend && (
        <div className="p-4 bg-bgprimary/50 border-b border-accent/20">
            <form onSubmit={handleAddFriend}>
                <input
                    id="add-friend-input"
                    name="addUsername"
                    type="text" 
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    placeholder="Enter username (e.g. User 3)"
                    className="w-full px-3 py-2 bg-bgprimary border border-secondary/20 rounded-lg mb-2 text-sm text-primary placeholder-secondary focus:outline-none focus:border-accent/50"
                    disabled={isSearching}
                />
                <button 
                    type="submit" 
                    disabled={isSearching}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                        isSearching ? 'bg-secondary/20 text-secondary cursor-not-allowed' : 'bg-accent text-bgprimary hover:bg-accent/90'
                    }`}
                >
                    {isSearching ? 'Processing...' : 'Send Request'}
                </button>
                {addStatus && <p className="text-xs mt-2 text-secondary">{addStatus}</p>}
            </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Pending Requests Section (Collapsible + Scrollable) */}
        {(pendingRequests.length > 0 || sentRequests.length > 0) && (
            <div className="mb-4 border-b border-accent/10">
                
                {/* A. The Clickable Header (Toggle) */}
                <button
                    onClick={() => setShowPending(!showPending)}
                    className="w-full px-4 py-2 bg-accent/10 flex justify-between items-center transition-colors hover:bg-accent/20 group"
                >
                    <span className="text-xs font-bold text-accent uppercase tracking-wider group-hover:text-accent/80">
                        Pending Requests ({pendingRequests.length + sentRequests.length})
                    </span>
                    {/* Reusing your existing Chevron Icon */}
                    <ChevronDownIcon 
                        className={`w-3 h-3 text-accent transition-transform duration-200 ${showPending ? 'rotate-180' : ''}`} 
                    />
                </button>

                {/* B. The Content (Scrollable) */}
                {showPending && (
                    <div className="max-h-64 overflow-y-auto bg-bgprimary/10 transition-all">
                        
                        {/* Pending (Received) */}
                        {pendingRequests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-3 border-b border-secondary/10 hover:bg-bgprimary/30 transition-colors">
                                <span className="text-sm font-medium text-primary">{req.username}</span>
                                <div className="flex space-x-1">
                                    <button 
                                      onClick={() => acceptRequest(req.friendshipId, req.id)} 
                                      className="text-online hover:bg-online/20 p-2 rounded-lg transition-colors"
                                      title="Accept"
                                    >
                                      <CheckIcon className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => declineRequest(req.friendshipId)} 
                                      className="text-red hover:bg-red/20 p-2 rounded-lg transition-colors"
                                      title="Decline"
                                    >
                                      <CrossIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Sent (Outgoing) */}
                        {sentRequests.map((req: any) => (
                            <div key={req.id} className="flex items-center justify-between p-3 border-b border-secondary/10 opacity-60 hover:opacity-100 transition-opacity">
                              <div className="flex flex-col">
                                  {/* ✅ FIX 1: Prefer Username */}
                                  <span className="text-xs text-secondary"> To: {req.username || 'Unknown User'} </span>
                                  <span className="text-[10px] text-secondary/50 italic">Waiting...</span>
                              </div>
                                <button 
                                  onClick={() => declineRequest(req.id)} 
                                  className="text-xs text-secondary hover:text-red transition-colors px-2 py-1 rounded hover:bg-red/10"
                                >
                                  Cancel
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Filter Input with Search Icon */}
        <div className="px-4 pb-2 mt-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
              <input
                id="filter-friends-input"
                name="filterFriends"
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Search friends..." 
                className="w-full pl-10 pr-3 py-2 bg-bgprimary border border-secondary/20 rounded-lg text-sm text-primary placeholder-secondary focus:outline-none focus:border-accent/50"
              />
            </div>
        </div>

        {/* System Bot */}
        <div 
            onClick={() => selectFriend(SYSTEM_ID)}
            className={`flex items-center p-3 cursor-pointer hover:bg-bgprimary/50 transition-colors border-b border-secondary/10 ${
                selectedFriendId === SYSTEM_ID ? 'bg-accent/10 border-r-4 border-accent' : ''
            }`}
        >
            <div className="relative">
                <img src={systemBot.avatarUrl} alt="System" className="w-10 h-10 rounded-full bg-secondary/20 p-1 border-2 border-secondary" />
            </div>
            <div className="ml-3">
                <h4 className="font-bold text-primary">System Messages</h4>
                <p className="text-xs text-secondary">Official Notifications</p>
            </div>
        </div>

        {/* Friends List */}
        {friends.length === 0 ? (
          <p className="text-center text-secondary mt-4 text-sm">No friends yet.</p>
        ) : (
          filteredFriends.map((friend, index) => {
            const currentStatus = userStatuses[friend.id] || 'offline';
            const friendWithStatus = { ...friend, status: currentStatus as 'online' | 'offline' | 'in-game' };
            
            return (
                <FriendItem key={`${friend.id}-${index}`} friend={friendWithStatus} />
            );
          })
        )}
      </div>

      {/* Blocked List */}
      <div className="border-t border-accent/20 bg-bgsecondary/80">
        <button 
            onClick={() => setShowBlocked(!showBlocked)}
            className="w-full p-3 flex justify-between items-center text-sm text-secondary hover:bg-bgprimary/30 font-medium transition-colors"
        >
            <span>Blocked Users ({blockedUsers.length})</span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showBlocked ? 'rotate-180' : ''}`} />
        </button>
        
        {showBlocked && (
            <div className="max-h-40 overflow-y-auto bg-bgprimary/30">
                {blockedUsers.map((friend) => {
                    const currentStatus = userStatuses[friend.id] || 'offline';
                    const friendWithStatus = { 
                        ...friend, 
                        status: currentStatus as 'online' | 'offline' | 'in-game' 
                    };

                    return (
                        <div key={friend.id} className="opacity-50 border-b border-secondary/10">
                            <FriendItem friend={friendWithStatus} />
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
};