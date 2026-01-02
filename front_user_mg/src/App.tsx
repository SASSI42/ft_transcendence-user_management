import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth';
// import UserProfile from './pages/user_profile';
import Signin from './components/signin';
import Signup from './components/signup';
import Update_password from './components/update_password';
import Update_email from './components/update_email';
import Update_username from './components/update_username';
import DashboardPage from './pages/dashboard';
import PasswordLost from './components/password-lost';
import PasswordReset from './components/reset-pasword';
import { useAuth, AuthProvider } from './components/authContext';
import { ToastProvider } from './components/toastContext';
import NotFoundPage from './components/NotFoundPage';
import TwoFactor from './components/twoFactor';
// import Leaderboard from './pages/leaderboard';
// import Recent_maches from './pages/recent_maches';
import { ChatPage } from "./pages/chat";
import { GameMenu } from './components/game/GameMenu';
import { LocalGame } from './components/game/LocalGame';
import { RemoteGame } from './components/game/RemoteGame';
import { Tournament } from './components/game/Tournament';
import { RemoteTournament } from './components/game/RemoteTournament';



const AuthRoutes = () => {
  // const { logout } = useAuth() as any;
  // logout();
  const { isLoggedIn } = useAuth();
  console.log("isLoggedIn : ", isLoggedIn);

  return (
    <>
      <Routes>
        <Route path="/signin" element={!isLoggedIn ? <LoginPage page="sign_in"> <Signin /> </LoginPage> : <DashboardPage/>} />
        <Route path="/twoFactor" element={!isLoggedIn ? <LoginPage page="two_factor"> <TwoFactor /> </LoginPage> : <DashboardPage/>} />
        <Route path="/signup" element={!isLoggedIn ? <LoginPage page="sign_up"> <Signup /> </LoginPage> : <DashboardPage/>} />
        <Route path="/update_email" element={isLoggedIn ? <LoginPage page="update_email"> <Update_email /> </LoginPage> : <Navigate to="/signin"/>} />
        <Route path="/update_password" element={isLoggedIn ? <LoginPage page="update_password"> <Update_password /> </LoginPage> : <Navigate to="/signin"/>} />
        <Route path="/update_username" element={isLoggedIn ? <LoginPage page="update_username"> <Update_username /> </LoginPage> : <Navigate to="/signin"/>} />
        <Route path="/forgot-password" element={!isLoggedIn ? <LoginPage page="password_lost"> <PasswordLost /> </LoginPage> : <Navigate to="/signin" />} />
        <Route path="/reset-password" element={isLoggedIn ? <LoginPage page="password_reset"> <PasswordReset /> </LoginPage> : <Navigate to="/signin" /> } />
        <Route path="/" element={isLoggedIn ? <DashboardPage /> : <Navigate to="/signin" />} />
        <Route path="/dashboard" element={isLoggedIn ? <DashboardPage /> : <Navigate to="/signin"/>} />
        <Route path="/game" element={isLoggedIn ? <GameMenu /> : <Navigate to="/signin" />} />
        <Route path="/game/local" element={isLoggedIn ? <LocalGame /> : <Navigate to="/signin" />} />
        <Route path="/game/remote" element={isLoggedIn ? <RemoteGame /> : <Navigate to="/signin" />} />
        <Route path="/tournament/local" element={isLoggedIn ? <Tournament /> : <Navigate to="/signin" />} />
        <Route path="/tournament/remote" element={isLoggedIn ? <RemoteTournament /> : <Navigate to="/signin" />} />
        <Route path="*" element={isLoggedIn ? <LoginPage page="not_found_page"> <NotFoundPage /> </LoginPage> : <Navigate to = "/signin"/>} />
        {/* <Route path="/user_profile" element={isLoggedIn ? <UserProfile page="user_profile"> </UserProfile> : <Navigate to = "/signin"/>} />
        <Route path="/leaderboard" element={isLoggedIn ? <Leaderboard page="leaderboard"> </Leaderboard> : <Navigate to = "/signin"/>} />
        <Route path="/recent_maches" element={isLoggedIn ? <Recent_maches page="recent_maches"> </Recent_maches> : <Navigate to = "/signin"/>} /> */}
        <Route path="/chat" element={
            isLoggedIn ? <ChatPage /> : <Navigate to="/signin" /> } />
      </Routes>
    </>
  );
}
function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AuthRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
