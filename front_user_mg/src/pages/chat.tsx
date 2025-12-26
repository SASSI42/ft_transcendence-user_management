import { useEffect } from 'react';
import { FriendsList } from '../components/Friends/FriendsList';
import { ChatWindow } from '../components/Chat/ChatWindow';
import { WaitingModal } from '../components/UI/WaitingModal';
import { useAuth } from '../components/authContext';
import { socketService } from '../services/socket';

export const ChatPage = () => {
    const { token } = useAuth();

    // Initialize Socket when entering the page
    useEffect(() => {
        if (token && !socketService.socket?.connected) {
            socketService.connect();
        }
        // Optional: Disconnect when leaving the page if you want to save resources
        // return () => socketService.disconnect();
    }, [token]);

return (
        <div className="flex h-[calc(100vh-4rem)] w-full max-w-7xl mx-auto border border-white/10 rounded-2xl overflow-hidden shadow-2xl mt-4 relative">
            
            {/* ✅ ADDED: Modals must be rendered here to appear! */}
            <WaitingModal />
            {/* <GameInviteModal /> */}

            {/* Left Sidebar: Friends & Requests */}
            <div className="w-80 border-r border-white/10 bg-bgsecondary backdrop-blur-sm">
                <FriendsList />
            </div>

            {/* Main Area: Chat Window */}
            {/* 🛠️ FIX: Added 'flex flex-col' so ChatWindow fills the height */}
            <div className="flex-1 bg-bgprimary/90 relative flex flex-col">
                <ChatWindow />
            </div>
        </div>
    );
}