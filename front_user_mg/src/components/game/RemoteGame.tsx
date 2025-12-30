import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext';
import {
  useWebSocket,
  type ConnectionStatus,
  type ServerGameState,
  type PlayerSide,
  type MatchPlayers,
  type InputCommand,
} from "../../hooks/game/useWebSocket";
import { GAME_CONFIG } from "../../game/config";

export function RemoteGame() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const {
    connectionStatus,
    gameState,
    playerSide,
    players,
    winner,
    errorMessage,
    connect,
    disconnect,
    sendInput,
    sendReady,
  } = useWebSocket();

  // Auto-connect with authenticated user
  useEffect(() => {
    if (isLoggedIn && user && connectionStatus === "disconnected") {
      connect(user.username, user.id).catch(console.error);
    }
  }, [isLoggedIn, user, connectionStatus, connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Auto-ready when match is found
  useEffect(() => {
    if (connectionStatus === "matched" && gameState?.status === "waiting") {
      console.log("🎮 Auto-marking player as ready");
      sendReady();
    }
  }, [connectionStatus, gameState?.status, sendReady]);

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-pong-bg flex flex-col items-center justify-center text-slate-200">
        <h1 className="text-4xl font-oswald font-bold mb-4 text-pong-teal">Authentication Required</h1>
        <p className="text-xl mb-6">Please log in to play remote games</p>
        <button
          onClick={() => navigate('/signin')}
          className="px-8 py-4 bg-pong-teal hover:brightness-110 text-pong-text-dark font-oswald font-bold text-xl rounded-[12px] transition-all"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // Render different UI states based on connection status
  return (
    <div className="min-h-screen bg-pong-bg flex flex-col">
      <div className="p-4">
        <button
          onClick={() => navigate('/game')}
          className="px-6 py-3 rounded-md secondary-button font-oswald text-h4 uppercase"
        >
          ← Back to Menu
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-slate-200 p-4">
        <h1 className="text-6xl font-oswald font-bold mb-8 text-pong-teal uppercase" style={{ textShadow: '0 0 20px rgba(102, 232, 250, 0.5)' }}>
          REMOTE 1V1
        </h1>

        {/* Show username */}
        <div className="mb-4 text-xl font-roboto">
          Playing as: <span className="text-pong-teal font-bold">{user?.username}</span>
        </div>

      <ConnectionStatusBadge status={connectionStatus} />

      {connectionStatus === "connecting" && <LoadingSpinner text="Connecting..." />}

        {connectionStatus === "queued" && (
          <div className="text-center">
            <LoadingSpinner text="Searching for opponent..." />
            <button
              onClick={handleDisconnect}
              className="mt-4 px-4 py-2 rounded-md secondary-button font-roboto"
            >
              Cancel
            </button>
          </div>
        )}

        {connectionStatus === "matched" && gameState && players && (
          <div className="text-center">
            <MatchInfo players={players} playerSide={playerSide} />
            <LoadingSpinner text="Get ready..." />
          </div>
        )}

        {connectionStatus === "playing" && gameState && players && playerSide && (
          <GameView
            gameState={gameState}
            players={players}
            playerSide={playerSide}
            sendInput={sendInput}
          />
        )}

        {connectionStatus === "ended" && gameState && players && (
          <GameOverView
            gameState={gameState}
            players={players}
            winner={winner}
            username={username}
            onPlayAgain={handleDisconnect}
          />
        )}

        {connectionStatus === "opponent_disconnected" && (
          <div className="text-center">
            <div className="text-2xl text-yellow-400 mb-4 font-oswald">
              Opponent Disconnected
            </div>
            <p className="text-gray-400 mb-4 font-roboto">
              Waiting for opponent to reconnect...
            </p>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 rounded-md secondary-button font-roboto"
            >
              Leave Match
            </button>
          </div>
        )}

        {connectionStatus === "error" && (
          <div className="text-center">
            <div className="text-2xl text-red-400 mb-4 font-oswald">Connection Error</div>
            <p className="text-gray-400 mb-4 font-roboto">{errorMessage || "An error occurred"}</p>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 rounded-lg primary-button font-oswald font-bold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
}

function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  const statusColors: Record<ConnectionStatus, string> = {
    disconnected: "bg-gray-600",
    connecting: "bg-yellow-600",
    connected: "bg-green-600",
    queued: "bg-blue-600",
    matched: "bg-purple-600",
    playing: "bg-green-500",
    ended: "bg-gray-500",
    error: "bg-red-600",
    opponent_disconnected: "bg-yellow-600",
  };

  const statusLabels: Record<ConnectionStatus, string> = {
    disconnected: "Disconnected",
    connecting: "Connecting...",
    connected: "Connected",
    queued: "In Queue",
    matched: "Matched",
    playing: "Playing",
    ended: "Game Over",
    error: "Error",
    opponent_disconnected: "Opponent Disconnected",
  };

  return (
    <div
      className={`px-3 py-1 rounded-full text-sm font-medium mb-4 ${statusColors[status]}`}
    >
      {statusLabels[status]}
    </div>
  );
}

interface JoinFormProps {
  inputUsername: string;
  setInputUsername: (value: string) => void;
  onJoin: () => void;
}

function JoinForm({ inputUsername, setInputUsername, onJoin }: JoinFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-80">
      <input
        type="text"
        value={inputUsername}
        onChange={(e) => setInputUsername(e.target.value)}
        placeholder="Enter your username"
        className="px-4 py-3 bg-bg-secondary border border-slate-600/30 rounded-xl text-slate-200 placeholder-gray-400 focus:border-cyan-neon focus:outline-none w-full font-roboto"
        maxLength={32}
      />
      <button
        type="submit"
        disabled={!inputUsername.trim()}
        className="px-8 py-4 bg-cyan-neon hover:bg-cyan-glow disabled:bg-dark-700 disabled:cursor-not-allowed text-bg-primary font-oswald font-bold text-xl rounded-xl transition-all shadow-lg w-full"
        style={{ boxShadow: !inputUsername.trim() ? 'none' : '0 0 15px rgba(0, 207, 255, 0.3)' }}
      >
        FIND MATCH
      </button>
    </form>
  );
}

interface LoadingSpinnerProps {
  text: string;
}

function LoadingSpinner({ text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pong-teal mb-4"></div>
      <p className="text-gray-400 font-roboto">{text}</p>
    </div>
  );
}

interface MatchInfoProps {
  players: MatchPlayers;
  playerSide: PlayerSide | null;
}

function MatchInfo({ players, playerSide }: MatchInfoProps) {
  return (
    <div className="mb-4">
      <div className="text-xl text-gray-300 mb-2 font-oswald">Match Found!</div>
      <div className="flex justify-center gap-8 text-lg font-roboto">
        <div
          className={`${
            playerSide === "left" ? "text-pong-teal font-bold" : "text-gray-400"
          }`}
        >
          {players.left.username}
          {playerSide === "left" && " (You)"}
        </div>
        <div className="text-gray-500">vs</div>
        <div
          className={`${
            playerSide === "right" ? "text-pong-teal font-bold" : "text-gray-400"
          }`}
        >
          {players.right.username}
          {playerSide === "right" && " (You)"}
        </div>
      </div>
    </div>
  );
}

interface GameViewProps {
  gameState: ServerGameState;
  players: MatchPlayers;
  playerSide: PlayerSide;
  sendInput: (command: InputCommand) => void;
}

function GameView({ gameState, players, playerSide, sendInput }: GameViewProps) {
  const currentInputRef = useRef<InputCommand>("stop");

  // Keyboard input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      let newCommand: InputCommand | null = null;

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        newCommand = "up";
        e.preventDefault();
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        newCommand = "down";
        e.preventDefault();
      }

      if (newCommand && newCommand !== currentInputRef.current) {
        currentInputRef.current = newCommand;
        sendInput(newCommand);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const isUp = e.key === "ArrowUp" || e.key === "w" || e.key === "W";
      const isDown = e.key === "ArrowDown" || e.key === "s" || e.key === "S";

      if (isUp || isDown) {
        e.preventDefault();
        if (currentInputRef.current !== "stop") {
          currentInputRef.current = "stop";
          sendInput("stop");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [sendInput]);

  return (
    <div className="flex flex-col items-center">
      {/* Scoreboard */}
      <div className="flex justify-center gap-16 mb-4 text-3xl font-oswald">
        <div className="text-center">
          <div
            className={`text-sm font-roboto ${
              playerSide === "left" ? "text-pong-teal" : "text-gray-400"
            }`}
          >
            {players.left.username}
            {playerSide === "left" && " (You)"}
          </div>
          <div className="font-bold text-pong-teal">{gameState.score.left}</div>
        </div>
        <div className="text-gray-500">-</div>
        <div className="text-center">
          <div
            className={`text-sm font-roboto ${
              playerSide === "right" ? "text-pong-teal" : "text-gray-400"
            }`}
          >
            {players.right.username}
            {playerSide === "right" && " (You)"}
          </div>
          <div className="font-bold text-pong-teal">{gameState.score.right}</div>
        </div>
      </div>

      {/* Game Canvas */}
      <RemoteGameCanvas gameState={gameState} />

      {/* Controls hint */}
      <div className="mt-4 text-gray-400 text-sm font-roboto">
        <span>Use Arrow Up/Down or W/S keys to move your paddle</span>
      </div>
    </div>
  );
}

interface RemoteGameCanvasProps {
  gameState: ServerGameState;
}

function RemoteGameCanvas({ gameState }: RemoteGameCanvasProps) {
  const { arenaWidth, arenaHeight, paddle, ball } = GAME_CONFIG;

  // Backend sends normalized coordinates (0 to 1), convert to pixels
  // Ball position - convert from normalized (0-1) to pixels
  const ballX = gameState.ball.position.x * arenaWidth;
  const ballY = gameState.ball.position.y * arenaHeight;
  const ballSize = ball.radius * 2;

  // Paddle positions - convert from normalized (0-1) to pixels
  // Paddles are at the edges of the arena
  const leftPaddleX = paddle.offset; // Small offset from left edge
  const rightPaddleX = arenaWidth - paddle.width - paddle.offset; // Small offset from right edge
  const leftPaddleY = gameState.paddles.left.position * arenaHeight;
  const rightPaddleY = gameState.paddles.right.position * arenaHeight;

  return (
    <div
      className="relative rounded-2xl border border-gray-600 overflow-hidden"
      style={{ 
        width: arenaWidth, 
        height: arenaHeight,
        backgroundColor: '#7B8A9A',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Center line */}
      <div
        className="absolute"
        style={{
          left: arenaWidth / 2 - 1,
          top: 0,
          width: 2,
          height: arenaHeight,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }}
      />

      {/* Ball */}
      <div
        className="absolute bg-white rounded-full"
        style={{
          left: ballX - ball.radius,
          top: ballY - ball.radius,
          width: ballSize,
          height: ballSize,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      />

      {/* Left Paddle */}
      <div
        className="absolute bg-white rounded-md"
        style={{
          left: leftPaddleX,
          top: leftPaddleY - paddle.height / 2,
          width: paddle.width,
          height: paddle.height,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      />

      {/* Right Paddle */}
      <div
        className="absolute bg-white rounded-md"
        style={{
          left: rightPaddleX,
          top: rightPaddleY - paddle.height / 2,
          width: paddle.width,
          height: paddle.height,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      />
    </div>
  );
}

interface GameOverViewProps {
  gameState: ServerGameState;
  players: MatchPlayers;
  winner: PlayerSide | null;
  username: string;
  onPlayAgain: () => void;
}

function GameOverView({
  gameState,
  players,
  winner,
  username,
  onPlayAgain,
}: GameOverViewProps) {
  const isWinner =
    winner &&
    ((winner === "left" && players.left.username === username) ||
      (winner === "right" && players.right.username === username));

  return (
    <div className="flex flex-col items-center">
      {/* Final Score */}
      <div className="flex justify-center gap-16 mb-4 text-3xl font-oswald">
        <div className="text-center">
          <div className="text-sm text-gray-400 font-roboto">{players.left.username}</div>
          <div className="font-bold text-pong-teal">{gameState.score.left}</div>
        </div>
        <div className="text-gray-500">-</div>
        <div className="text-center">
          <div className="text-sm text-gray-400 font-roboto">{players.right.username}</div>
          <div className="font-bold text-pong-teal">{gameState.score.right}</div>
        </div>
      </div>

      {/* Winner announcement */}
      <div className="text-center mb-8">
        <div
          className={`text-4xl font-oswald font-bold mb-2 ${
            isWinner ? "text-pong-teal" : "text-gray-400"
          }`}
        >
          {isWinner ? "YOU WIN!" : "YOU LOSE!"}
        </div>
        <div className="text-xl text-gray-400 font-roboto">
          {winner && `${players[winner].username} wins the match!`}
        </div>
      </div>

      <button
        onClick={onPlayAgain}
        className="px-8 py-4 bg-cyan-neon hover:bg-cyan-glow text-bg-primary font-oswald font-bold text-xl rounded-xl transition-all shadow-lg"
        style={{ boxShadow: '0 0 15px rgba(0, 207, 255, 0.3)' }}
      >
        PLAY AGAIN
      </button>
    </div>
  );
}
