import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../authContext';
import {
  useTournamentWebSocket,
  type TournamentConnectionStatus,
  type TournamentSnapshot,
  type TournamentParticipantSnapshot,
  type TournamentBracketMatchSnapshot,
  type TournamentBracketRoundSnapshot,
  type ServerGameState,
  type PlayerSide,
  type MatchPlayers,
  type InputCommand,
} from "../../hooks/game/useTournamentWebSocket";
import { GAME_CONFIG } from "../../game/config";

type TournamentPhase = "lobby" | "create" | "join" | "waiting" | "bracket" | "playing" | "champion";

export function RemoteTournament() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const codeFromUrl = queryParams.get('code');
  
  const [uiPhase, setUiPhase] = useState<"lobby" | "create" | "join">(codeFromUrl ? "join" : "lobby");
  const [inputAlias, setInputAlias] = useState("");
  const [inputCode, setInputCode] = useState(codeFromUrl || "");
  const [inputTournamentName, setInputTournamentName] = useState("Remote Cup");
  const [inputCapacity, setInputCapacity] = useState<4 | 8>(8);

  const {
    connectionStatus,
    tournamentSnapshot,
    tournamentCode,
    alias,
    errorMessage,
    gameState,
    playerSide,
    players,
    winner,
    connect,
    disconnect,
    createTournament,
    joinTournament,
    leaveTournament,
    setReady,
    sendInput,
    sendReady,
  } = useTournamentWebSocket();

  // Connect on mount if not connected
  useEffect(() => {
    if (connectionStatus === "disconnected") {
      void connect();
    }
  }, [connectionStatus, connect]);

  // Compute phase based on connection status and tournament state
  const phase: TournamentPhase = (() => {
    if (connectionStatus === "in_match" && gameState) {
      return "playing";
    }
    if (connectionStatus === "joined" && tournamentSnapshot) {
      if (tournamentSnapshot.bracket?.champion) {
        return "champion";
      }
      if (tournamentSnapshot.bracket) {
        return "bracket";
      }
      return "waiting";
    }
    // Fall back to user-selected UI phase for lobby/create/join
    return uiPhase;
  })();

  // Auto-send ready when match starts
  useEffect(() => {
    if (connectionStatus === "in_match" && gameState?.status === "ready") {
      sendReady();
    }
  }, [connectionStatus, gameState?.status, sendReady]);

  const handleCreateTournament = useCallback(() => {
    console.log("🚀 CREATE TOURNAMENT - Handler Called", {
      inputAlias: inputAlias.trim(),
      inputTournamentName: inputTournamentName.trim(),
      inputCapacity,
      userId: user?.id,
      isLoggedIn,
      willProceed: !!(inputAlias.trim() && inputTournamentName.trim() && isLoggedIn && user),
    });
    
    if (!inputAlias.trim() || !inputTournamentName.trim()) {
      console.error("❌ CREATE TOURNAMENT - Validation failed: empty fields", {
        aliasEmpty: !inputAlias.trim(),
        nameEmpty: !inputTournamentName.trim(),
      });
      return;
    }
    
    if (!isLoggedIn || !user) {
      console.error("❌ CREATE TOURNAMENT - Validation failed: not authenticated", {
        isLoggedIn,
        hasUser: !!user,
      });
      return;
    }
    
    console.log("✅ CREATE TOURNAMENT - Calling createTournament", {
      name: inputTournamentName.trim(),
      alias: inputAlias.trim(),
      userId: user.id,
      capacity: inputCapacity,
    });
    
    createTournament(inputTournamentName.trim(), inputAlias.trim(), user.id, inputCapacity);
  }, [inputAlias, inputTournamentName, inputCapacity, createTournament, user, isLoggedIn]);

  const handleJoinTournament = useCallback(() => {
    console.log("🚀 JOIN TOURNAMENT - Handler Called", {
      inputAlias: inputAlias.trim(),
      inputCode: inputCode.trim(),
      userId: user?.id,
      isLoggedIn,
      willProceed: !!(inputAlias.trim() && inputCode.trim() && isLoggedIn && user),
    });
    
    if (!inputAlias.trim() || !inputCode.trim()) {
      console.error("❌ JOIN TOURNAMENT - Validation failed: empty fields", {
        aliasEmpty: !inputAlias.trim(),
        codeEmpty: !inputCode.trim(),
      });
      return;
    }
    
    if (!isLoggedIn || !user) {
      console.error("❌ JOIN TOURNAMENT - Validation failed: not authenticated", {
        isLoggedIn,
        hasUser: !!user,
      });
      return;
    }
    
    console.log("✅ JOIN TOURNAMENT - Calling joinTournament", {
      code: inputCode.trim().toUpperCase(),
      alias: inputAlias.trim(),
      userId: user.id,
    });
    
    joinTournament(inputCode.trim().toUpperCase(), inputAlias.trim(), user.id);
  }, [inputAlias, inputCode, joinTournament, user, isLoggedIn]);

  const handleLeaveTournament = useCallback(() => {
    leaveTournament();
    setUiPhase("lobby");
    setInputAlias("");
    setInputCode("");
    setInputTournamentName("Remote Cup");
    setInputCapacity(8);
  }, [leaveTournament]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setUiPhase("lobby");
    setInputAlias("");
    setInputCode("");
    setInputTournamentName("Remote Cup");
    setInputCapacity(8);
  }, [disconnect]);

  const handleToggleReady = useCallback(() => {
    if (!tournamentSnapshot || !alias) return;
    const participant = tournamentSnapshot.participants.find(p => p.alias === alias);
    if (participant) {
      setReady(!participant.ready);
    }
  }, [tournamentSnapshot, alias, setReady]);

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-pong-bg flex flex-col items-center justify-center text-slate-200">
        <h1 className="text-4xl font-oswald font-bold mb-4 text-pong-teal">Authentication Required</h1>
        <p className="text-xl mb-6">Please log in to join tournaments</p>
        <button
          onClick={() => navigate('/signin')}
          className="px-8 py-4 bg-pong-teal hover:brightness-110 text-pong-text-dark font-oswald font-bold text-xl rounded-[12px] transition-all"
        >
          Go to Login
        </button>
      </div>
    );
  }

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
        <h1 className="text-5xl font-oswald font-bold mb-4 text-pong-teal" style={{ textShadow: '0 0 20px rgba(0, 207, 255, 0.5)' }}>
          REMOTE TOURNAMENT
        </h1>

      <ConnectionStatusBadge status={connectionStatus} />

        {errorMessage && (
          <div className="mb-4 submission-error max-w-md text-center font-roboto">
            {errorMessage}
          </div>
        )}

        {/* Lobby - Choose to create or join */}
        {phase === "lobby" && connectionStatus === "connected" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-400 mb-4 font-roboto">Create a new tournament or join an existing one</p>
            <div className="flex gap-4">
              <button
                onClick={() => setUiPhase("create")}
                className="px-8 py-4 bg-cyan-neon hover:bg-cyan-glow text-bg-primary font-oswald font-bold text-xl rounded-xl transition-all shadow-lg"
                style={{ boxShadow: '0 0 15px rgba(0, 207, 255, 0.3)' }}
              >
                CREATE TOURNAMENT
              </button>
              <button
                onClick={() => setUiPhase("join")}
                className="px-8 py-4 bg-bg-secondary hover:bg-dark-700 border-2 border-cyan-neon text-cyan-neon font-oswald font-bold text-xl rounded-xl transition-all"
              >
                JOIN TOURNAMENT
              </button>
            </div>
          </div>
        )}

      {/* Create Tournament Form */}
      {phase === "create" && connectionStatus === "connected" && (
        <CreateTournamentForm
          inputAlias={inputAlias}
          inputTournamentName={inputTournamentName}
          inputCapacity={inputCapacity}
          setInputAlias={setInputAlias}
          setInputTournamentName={setInputTournamentName}
          setInputCapacity={setInputCapacity}
          onSubmit={handleCreateTournament}
          onBack={() => setUiPhase("lobby")}
          isAuthenticated={isLoggedIn}
          userName={user?.username ?? null}
        />
      )}

      {/* Join Tournament Form */}
      {phase === "join" && connectionStatus === "connected" && (
        <JoinTournamentForm
          inputAlias={inputAlias}
          inputCode={inputCode}
          setInputAlias={setInputAlias}
          setInputCode={setInputCode}
          onSubmit={handleJoinTournament}
          onBack={() => setUiPhase("lobby")}
          isAuthenticated={isLoggedIn}
          userName={user?.username ?? null}
        />
      )}

      {/* Waiting Room - Before bracket is generated */}
      {phase === "waiting" && tournamentSnapshot && (
        <WaitingRoom
          snapshot={tournamentSnapshot}
          tournamentCode={tournamentCode}
          alias={alias}
          onToggleReady={handleToggleReady}
          onLeave={handleLeaveTournament}
        />
      )}

      {/* Bracket View */}
      {phase === "bracket" && tournamentSnapshot && (
        <BracketView
          snapshot={tournamentSnapshot}
          alias={alias}
          onToggleReady={handleToggleReady}
          onLeave={handleLeaveTournament}
        />
      )}

      {/* Playing Match */}
      {phase === "playing" && gameState && players && playerSide && (
        <TournamentMatchView
          gameState={gameState}
          players={players}
          playerSide={playerSide}
          winner={winner}
          tournamentSnapshot={tournamentSnapshot}
          sendInput={sendInput}
        />
      )}

      {/* Champion Display */}
      {phase === "champion" && tournamentSnapshot && (
        <ChampionView
          snapshot={tournamentSnapshot}
          onNewTournament={handleDisconnect}
        />
      )}

        {/* Loading / Connecting States */}
        {connectionStatus === "connecting" && (
          <LoadingSpinner text="Connecting to server..." />
        )}

        {connectionStatus === "error" && (
          <div className="text-center">
            <p className="text-red-400 mb-4 font-roboto">{errorMessage || "Connection error"}</p>
            <button
              onClick={() => void connect()}
              className="px-4 py-2 bg-cyan-neon hover:bg-cyan-glow text-bg-primary rounded-lg transition-colors font-oswald font-bold"
            >
              RECONNECT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ConnectionStatusBadgeProps {
  status: TournamentConnectionStatus;
}

function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  const statusColors: Record<TournamentConnectionStatus, string> = {
    disconnected: "bg-gray-600",
    connecting: "bg-yellow-600",
    connected: "bg-green-600",
    joined: "bg-purple-600",
    in_match: "bg-cyan-500",
    error: "bg-red-600",
  };

  const statusLabels: Record<TournamentConnectionStatus, string> = {
    disconnected: "Disconnected",
    connecting: "Connecting...",
    connected: "Connected",
    joined: "In Tournament",
    in_match: "Playing Match",
    error: "Error",
  };

  return (
    <div
      className={`px-3 py-1 rounded-full text-sm font-medium mb-4 ${statusColors[status]}`}
    >
      {statusLabels[status]}
    </div>
  );
}

interface CreateTournamentFormProps {
  inputAlias: string;
  inputTournamentName: string;
  inputCapacity: 4 | 8;
  setInputAlias: (value: string) => void;
  setInputTournamentName: (value: string) => void;
  setInputCapacity: (value: 4 | 8) => void;
  onSubmit: () => void;
  onBack: () => void;
  isAuthenticated: boolean;
  userName: string | null;
}

function CreateTournamentForm({
  inputAlias,
  inputTournamentName,
  inputCapacity,
  setInputAlias,
  setInputTournamentName,
  setInputCapacity,
  onSubmit,
  onBack,
  isAuthenticated,
  userName,
}: CreateTournamentFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🎮 CREATE TOURNAMENT - Form Submit", {
      inputAlias: inputAlias.trim(),
      inputTournamentName: inputTournamentName.trim(),
      inputCapacity,
      canSubmit: inputAlias.trim() && inputTournamentName.trim(),
    });
    onSubmit();
  };

  const canSubmit = inputAlias.trim() && inputTournamentName.trim() && isAuthenticated;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md p-6 bg-bg-secondary rounded-2xl border border-slate-600/30">
      <h2 className="text-2xl font-oswald font-bold text-cyan-neon mb-4">Create Tournament</h2>
      
      {/* Authentication Status */}
      {!isAuthenticated && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">
          ❌ You must be logged in to create a tournament
        </div>
      )}
      {isAuthenticated && userName && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 rounded text-green-400 text-sm">
          ✅ Logged in as: {userName}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-300 text-sm mb-2 font-roboto">Tournament Name</label>
        <input
          type="text"
          value={inputTournamentName}
          onChange={(e) => setInputTournamentName(e.target.value)}
          placeholder="Enter tournament name"
          className="w-full px-4 py-2 bg-bg-primary text-slate-200 border border-slate-600/30 rounded-xl focus:border-cyan-neon focus:outline-none font-roboto"
          maxLength={64}
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-300 text-sm mb-2 font-roboto">Your Alias</label>
        <input
          type="text"
          value={inputAlias}
          onChange={(e) => setInputAlias(e.target.value)}
          placeholder="Enter your alias"
          className="w-full px-4 py-2 bg-bg-primary text-slate-200 border border-slate-600/30 rounded-xl focus:border-cyan-neon focus:outline-none font-roboto"
          maxLength={32}
        />
      </div>

      <div className="mb-6">
        <label className="block text-white/70 text-sm mb-2 font-roboto uppercase">Bracket Size</label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Setting capacity to 4');
              setInputCapacity(4);
            }}
            className={`flex-1 px-4 py-2 rounded-xl transition-colors font-oswald cursor-pointer ${
              inputCapacity === 4
                ? "bg-cyan-neon text-bg-primary font-bold"
                : "bg-bg-primary border border-slate-600/30 text-slate-200 hover:bg-dark-700"
            }`}
          >
            4 PLAYERS
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Setting capacity to 8');
              setInputCapacity(8);
            }}
            className={`flex-1 px-4 py-2 rounded-xl transition-colors font-oswald cursor-pointer ${
              inputCapacity === 8
                ? "bg-cyan-neon text-bg-primary font-bold"
                : "bg-bg-primary border border-slate-600/30 text-slate-200 hover:bg-dark-700"
            }`}
          >
            8 PLAYERS
          </button>
        </div>
      </div>

      {/* Validation Status Display */}
      {!canSubmit && (
        <div className="mb-4 text-sm text-center">
          {!inputAlias.trim() && <p className="text-yellow-500">⚠️ Please enter your alias</p>}
          {!inputTournamentName.trim() && <p className="text-yellow-500">⚠️ Please enter tournament name</p>}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-4 py-2 bg-bg-primary hover:bg-dark-700 border border-slate-600/30 text-slate-200 rounded-xl transition-colors font-roboto"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`flex-1 px-4 py-2 font-oswald font-bold rounded-xl transition-all ${
            canSubmit
              ? "bg-cyan-neon hover:bg-cyan-glow text-bg-primary shadow-lg"
              : "bg-dark-700 text-gray-400 cursor-not-allowed"
          }`}
          style={canSubmit ? { boxShadow: '0 0 15px rgba(0, 207, 255, 0.3)' } : {}}
        >
          CREATE
        </button>
      </div>
    </form>
  );
}

interface JoinTournamentFormProps {
  inputAlias: string;
  inputCode: string;
  setInputAlias: (value: string) => void;
  setInputCode: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isAuthenticated: boolean;
  userName: string | null;
}

function JoinTournamentForm({
  inputAlias,
  inputCode,
  setInputAlias,
  setInputCode,
  onSubmit,
  onBack,
  isAuthenticated,
  userName,
}: JoinTournamentFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const canSubmit = inputAlias.trim() && inputCode.trim() && isAuthenticated;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md p-6 bg-bg-secondary rounded-2xl border border-slate-600/30">
      <h2 className="text-2xl font-oswald font-bold text-cyan-neon mb-4">Join Tournament</h2>

      {/* Authentication Status */}
      {!isAuthenticated && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">
          ❌ You must be logged in to join a tournament
        </div>
      )}
      {isAuthenticated && userName && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 rounded text-green-400 text-sm">
          ✅ Logged in as: {userName}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-300 text-sm mb-2 font-roboto">Tournament Code</label>
        <input
          type="text"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value.toUpperCase())}
          placeholder="Enter tournament code"
          className="w-full px-4 py-2 bg-bg-primary text-slate-200 border border-slate-600/30 rounded-xl focus:border-cyan-neon focus:outline-none uppercase font-mono"
          maxLength={8}
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-300 text-sm mb-2 font-roboto">Your Alias</label>
        <input
          type="text"
          value={inputAlias}
          onChange={(e) => setInputAlias(e.target.value)}
          placeholder="Enter your alias"
          className="w-full px-4 py-2 bg-bg-primary text-slate-200 border border-slate-600/30 rounded-xl focus:border-cyan-neon focus:outline-none font-roboto"
          maxLength={32}
        />
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-4 py-2 bg-bg-primary hover:bg-dark-700 border border-slate-600/30 text-slate-200 rounded-xl transition-colors font-roboto"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`flex-1 px-4 py-2 font-oswald font-bold rounded-xl transition-all ${
            canSubmit
              ? "bg-cyan-neon hover:bg-cyan-glow text-bg-primary shadow-lg"
              : "bg-dark-700 text-gray-400 cursor-not-allowed"
          }`}
          style={canSubmit ? { boxShadow: '0 0 15px rgba(0, 207, 255, 0.3)' } : {}}
        >
          JOIN
        </button>
      </div>
    </form>
  );
}

interface WaitingRoomProps {
  snapshot: TournamentSnapshot;
  tournamentCode: string | null;
  alias: string | null;
  onToggleReady: () => void;
  onLeave: () => void;
}

function WaitingRoom({
  snapshot,
  tournamentCode,
  alias,
  onToggleReady,
  onLeave,
}: WaitingRoomProps) {
  const currentParticipant = snapshot.participants.find(p => p.alias === alias);
  const isReady = currentParticipant?.ready ?? false;
  const readyCount = snapshot.participants.filter(p => p.ready).length;
  const connectedCount = snapshot.participants.filter(p => p.connected).length;

  return (
    <div className="w-full max-w-lg p-6 bg-dark-800 rounded-lg border border-slate-600">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-oswald font-bold text-cyan-400">{snapshot.name}</h2>
          <p className="text-gray-400 text-sm font-roboto">
            Waiting for players ({snapshot.participants.length}/{snapshot.capacity ?? 8})
          </p>
        </div>
        {tournamentCode && (
          <div className="text-right">
            <div className="text-gray-400 text-sm font-roboto">Share Code</div>
            <div className="text-2xl font-mono font-bold text-cyan-400">{tournamentCode}</div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-gray-300 text-sm mb-2 font-roboto">Players ({connectedCount} connected, {readyCount} ready)</h3>
        <div className="space-y-2">
          {snapshot.participants.map((participant) => (
            <ParticipantRow
              key={participant.alias}
              participant={participant}
              isCurrentUser={participant.alias === alias}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onLeave}
          className="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 border border-slate-600 text-slate-200 rounded transition-colors font-roboto"
        >
          Leave
        </button>
        <button
          onClick={onToggleReady}
          className={`flex-1 px-4 py-2 font-oswald font-bold rounded transition-all ${
            isReady
              ? "bg-dark-700 hover:bg-dark-600 border border-cyan-400 text-cyan-400"
              : "bg-cyan-400 hover:bg-cyan-500 text-dark-900 shadow-lg"
          }`}
          style={!isReady ? { boxShadow: '0 0 15px rgba(34, 211, 238, 0.3)' } : {}}
        >
          {isReady ? "CANCEL READY" : "READY"}
        </button>
      </div>
    </div>
  );
}

interface ParticipantRowProps {
  participant: TournamentParticipantSnapshot;
  isCurrentUser: boolean;
}

function ParticipantRow({ participant, isCurrentUser }: ParticipantRowProps) {
  return (
    <div
      className={`flex items-center justify-between p-2 rounded border ${
        isCurrentUser ? "bg-dark-700 border-cyan-400" : "bg-dark-800 border-slate-600"
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            participant.connected ? "bg-cyan-400" : "bg-gray-500"
          }`}
        />
        <span className={`font-roboto ${isCurrentUser ? "text-cyan-400 font-bold" : "text-slate-200"}`}>
          {participant.alias}
          {isCurrentUser && " (you)"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {participant.inMatch && (
          <span className="text-xs px-2 py-1 bg-cyan-400 text-dark-900 rounded font-roboto font-bold">Playing</span>
        )}
        {participant.ready && !participant.inMatch && (
          <span className="text-xs px-2 py-1 bg-cyan-400 text-dark-900 rounded font-roboto font-bold">Ready</span>
        )}
      </div>
    </div>
  );
}

interface BracketViewProps {
  snapshot: TournamentSnapshot;
  alias: string | null;
  onToggleReady: () => void;
  onLeave: () => void;
}

function BracketView({
  snapshot,
  alias,
  onToggleReady,
  onLeave,
}: BracketViewProps) {
  const currentParticipant = snapshot.participants.find(p => p.alias === alias);
  const isReady = currentParticipant?.ready ?? false;
  const isInMatch = currentParticipant?.inMatch ?? false;
  const playerMatch = alias && snapshot.bracket
    ? getUpcomingMatchForPlayer(snapshot.bracket.rounds, alias)
    : null;
  const opponentAlias = playerMatch
    ? playerMatch.left === alias
      ? playerMatch.right
      : playerMatch.left
    : null;
  const opponentParticipant = opponentAlias
    ? snapshot.participants.find(p => p.alias === opponentAlias)
    : undefined;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-cyan-400">{snapshot.name}</h2>
        <p className="text-gray-400 text-sm">Tournament in progress</p>
      </div>

      {/* Bracket Display */}
      <RemoteBracketDisplay snapshot={snapshot} currentAlias={alias} />

      <PlayerMatchPanel
        alias={alias}
        match={playerMatch}
        isReady={isReady}
        isInMatch={isInMatch}
        opponent={opponentParticipant}
        onToggleReady={onToggleReady}
      />

      {/* Participants list */}
      <div className="w-full max-w-md p-4 bg-gray-800 rounded-lg">
        <h3 className="text-gray-300 text-sm mb-2">Participants</h3>
        <div className="space-y-1">
          {snapshot.participants.map((participant) => (
            <ParticipantRow
              key={participant.alias}
              participant={participant}
              isCurrentUser={participant.alias === alias}
            />
          ))}
        </div>
      </div>

      <button
        onClick={onLeave}
        className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
      >
        Leave Tournament
      </button>
    </div>
  );
}

function getUpcomingMatchForPlayer(rounds: TournamentBracketRoundSnapshot[], alias: string) {
  for (const round of rounds) {
    for (const match of round.matches) {
      if (match.status === "completed") {
        continue;
      }
      if (match.left === alias || match.right === alias) {
        return match;
      }
    }
  }
  return null;
}

interface PlayerMatchPanelProps {
  alias: string | null;
  match: TournamentBracketMatchSnapshot | null;
  isReady: boolean;
  isInMatch: boolean;
  opponent?: TournamentParticipantSnapshot;
  onToggleReady: () => void;
}

function PlayerMatchPanel({ alias, match, isReady, isInMatch, opponent, onToggleReady }: PlayerMatchPanelProps) {
  if (!alias) {
    return null;
  }

  const buttonDisabled = !match || match.status === "completed" || isInMatch;
  const opponentLabel = opponent?.alias ?? "TBD";
  const statusLabel = match
    ? match.status === "current"
      ? "Match in progress"
      : match.status === "pending"
        ? "Waiting to start"
        : "Completed"
    : "Waiting for bracket";

  return (
    <div className="w-full max-w-md p-4 bg-gray-800 rounded-lg">
      <h3 className="text-gray-100 font-semibold mb-2">Your Match</h3>
      <p className="text-gray-400 text-sm mb-4">
        {match
          ? `${match.left} vs ${match.right}`
          : "You'll be assigned once the bracket advances."}
      </p>

      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-gray-400">Opponent</div>
          <div className="text-lg text-white">{opponentLabel}</div>
          {opponent && (
            <div className="text-xs text-gray-500">
              {opponent.inMatch
                ? "Currently playing"
                : opponent.ready
                  ? "Ready"
                  : "Not ready"}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Status</div>
          <div className="text-lg text-white">{statusLabel}</div>
        </div>
      </div>

      <button
        onClick={onToggleReady}
        disabled={buttonDisabled}
        className={`w-full px-4 py-2 font-bold rounded transition-colors ${
          buttonDisabled
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : isReady
              ? "bg-yellow-500 hover:bg-yellow-600 text-black"
              : "bg-green-500 hover:bg-green-600 text-black"
        }`}
      >
        {isInMatch ? "In Match" : isReady ? "Cancel Ready" : "Ready"}
      </button>

      {!match && (
        <p className="mt-2 text-xs text-gray-500">
          Once your next match is determined, stay ready so it can start immediately.
        </p>
      )}
    </div>
  );
}

interface RemoteBracketDisplayProps {
  snapshot: TournamentSnapshot;
  currentAlias: string | null;
}

function RemoteBracketDisplay({ snapshot }: RemoteBracketDisplayProps) {
  if (!snapshot.bracket) return null;

  // Match node component for remote tournament
  const RemoteMatchNode = ({ left, right, winner }: { left: string; right: string; winner: string | null | undefined }) => {
    const leftBg = winner === left ? 'bg-pong-teal' : 'bg-pong-node';
    const rightBg = winner === right ? 'bg-pong-teal' : 'bg-pong-node';
    
    return (
      <div className="flex flex-col z-10 mb-2">
        <div className={`flex items-center justify-between rounded-md mb-1 h-9 w-52 ${leftBg} text-pong-text-dark transition-transform hover:scale-105 duration-200 cursor-pointer shadow-sm`}>
          <span className="pl-3 text-sm font-oswald font-bold uppercase tracking-tight truncate max-w-[75%]">
            {left}
          </span>
          {winner === left && (
            <span className="pr-3 text-pong-winner">🏆</span>
          )}
        </div>
        <div className={`flex items-center justify-between rounded-md mb-1 h-9 w-52 ${rightBg} text-pong-text-dark transition-transform hover:scale-105 duration-200 cursor-pointer shadow-sm`}>
          <span className="pl-3 text-sm font-oswald font-bold uppercase tracking-tight truncate max-w-[75%]">
            {right}
          </span>
          {winner === right && (
            <span className="pr-3 text-pong-winner">🏆</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full p-6 bg-pong-card rounded-xl overflow-x-auto border border-white/5 shadow-2xl">
      <div className="flex gap-12">
        {snapshot.bracket.rounds.map((round) => (
          <div key={round.round} className="flex-shrink-0 min-w-52">
            <h3 className="text-lg font-oswald font-bold text-gray-300 mb-4 uppercase">
              Round {round.round}
            </h3>
            <div className="space-y-4">
              {round.matches.map((match) => (
                <RemoteMatchNode
                  key={match.id}
                  left={match.left}
                  right={match.right}
                  winner={match.winner}
                />
              ))}
            </div>
          </div>
        ))}
        
        {/* Champion display */}
        {snapshot.bracket.champion && (
          <div className="flex flex-col justify-center pl-4">
            <div className="flex items-center gap-4">
              <div className="bg-pong-node text-pong-text-dark font-oswald font-bold px-6 py-2 rounded-md min-w-[140px] text-center uppercase text-sm tracking-wider h-9 flex items-center justify-center shadow-sm">
                {snapshot.bracket.champion}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <span className="text-pong-winner font-oswald font-bold text-xl tracking-wide uppercase">Winner</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



interface TournamentMatchViewProps {
  gameState: ServerGameState;
  players: MatchPlayers;
  playerSide: PlayerSide;
  winner: PlayerSide | null;
  tournamentSnapshot: TournamentSnapshot | null;
  sendInput: (command: InputCommand) => void;
}

function TournamentMatchView({
  gameState,
  players,
  playerSide,
  winner,
  tournamentSnapshot,
  sendInput,
}: TournamentMatchViewProps) {
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
      {/* Tournament info */}
      {tournamentSnapshot && (
        <div className="text-sm text-gray-400 mb-2 font-roboto">
          {tournamentSnapshot.name}
        </div>
      )}

      {/* Scoreboard */}
      <div className="flex justify-center gap-16 mb-4 text-3xl font-oswald">
        <div className="text-center">
          <div
            className={`text-sm font-roboto ${
              playerSide === "left" ? "text-cyan-400" : "text-gray-400"
            }`}
          >
            {players.left.username}
            {playerSide === "left" && " (You)"}
          </div>
          <div className="font-bold text-cyan-400">{gameState.score.left}</div>
        </div>
        <div className="text-gray-500">-</div>
        <div className="text-center">
          <div
            className={`text-sm font-roboto ${
              playerSide === "right" ? "text-cyan-400" : "text-gray-400"
            }`}
          >
            {players.right.username}
            {playerSide === "right" && " (You)"}
          </div>
          <div className="font-bold text-cyan-400">{gameState.score.right}</div>
        </div>
      </div>

      {/* Game Canvas */}
      <RemoteGameCanvas gameState={gameState} />

      {/* Controls hint */}
      <div className="mt-4 text-gray-400 text-sm font-roboto">
        Use Arrow Up/Down or W/S keys to move your paddle
      </div>

      {/* Winner announcement */}
      {winner && (
        <div className="mt-4 text-center">
          <div
            className={`text-2xl font-oswald font-bold ${
              winner === playerSide ? "text-cyan-400" : "text-gray-400"
            }`}
          >
            {winner === playerSide ? "YOU WIN!" : "YOU LOSE!"}
          </div>
          <div className="text-gray-400 font-roboto">Returning to bracket...</div>
        </div>
      )}
    </div>
  );
}

interface RemoteGameCanvasProps {
  gameState: ServerGameState;
}

function RemoteGameCanvas({ gameState }: RemoteGameCanvasProps) {
  const { arenaWidth, arenaHeight, paddle, ball } = GAME_CONFIG;

  // Ball position
  const ballX = gameState.ball.position.x;
  const ballY = gameState.ball.position.y;
  const ballSize = ball.radius * 2;

  // Paddle positions
  const leftPaddleX = paddle.offset;
  const rightPaddleX = arenaWidth - paddle.offset;
  const leftPaddleY = gameState.paddles.left.position;
  const rightPaddleY = gameState.paddles.right.position;

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
        className="absolute bg-white rounded-full"
        style={{
          left: leftPaddleX - paddle.width / 2,
          top: leftPaddleY - paddle.height / 2,
          width: paddle.width,
          height: paddle.height,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      />

      {/* Right Paddle */}
      <div
        className="absolute bg-white rounded-full"
        style={{
          left: rightPaddleX - paddle.width / 2,
          top: rightPaddleY - paddle.height / 2,
          width: paddle.width,
          height: paddle.height,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      />
    </div>
  );
}

interface ChampionViewProps {
  snapshot: TournamentSnapshot;
  onNewTournament: () => void;
}

function ChampionView({ snapshot, onNewTournament }: ChampionViewProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-md p-8 bg-gradient-to-b from-cyan-900/30 to-dark-800 border-2 border-cyan-400 rounded-lg text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-oswald font-bold text-cyan-400 mb-2">CHAMPION!</h2>
        <div className="text-4xl font-oswald font-bold text-slate-200 mb-4">
          {snapshot.bracket?.champion || "Unknown"}
        </div>
        <div className="text-gray-400 mb-6 font-roboto">Winner of {snapshot.name}</div>

        <button
          onClick={onNewTournament}
          className="px-8 py-4 bg-cyan-400 hover:bg-cyan-500 text-dark-900 font-oswald font-bold text-xl rounded-lg transition-all shadow-lg"
          style={{ boxShadow: '0 0 15px rgba(34, 211, 238, 0.3)' }}
        >
          NEW TOURNAMENT
        </button>
      </div>

      {/* Final bracket display */}
      <RemoteBracketDisplay snapshot={snapshot} currentAlias={null} />
    </div>
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
