import { useState, useEffect, useCallback, useRef } from "react";
import { WebSocketClient } from "../../game/network/wsclient";

export type PlayerSide = "left" | "right";
export type MatchStatus = "waiting" | "ready" | "playing" | "ended";
export type QueueStatus = "waiting" | "matched";
export type InputCommand = "up" | "down" | "stop";

export interface Vector2 {
  x: number;
  y: number;
}

export interface PaddleState {
  position: number;
  direction: -1 | 0 | 1;
}

export interface ServerGameState {
  ball: { position: Vector2; velocity: Vector2 };
  paddles: Record<PlayerSide, PaddleState>;
  score: { left: number; right: number };
  status: MatchStatus;
  rally: number;
}

export interface MatchPlayer {
  username: string;
  side: PlayerSide;
}

export interface MatchPlayers {
  left: MatchPlayer;
  right: MatchPlayer;
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "queued"
  | "matched"
  | "playing"
  | "ended"
  | "error"
  | "opponent_disconnected";

interface ServerQueuePayload {
  status: QueueStatus;
  position?: number;
  roomId?: string;
}

interface ServerJoinedPayload {
  roomId: string;
  side: PlayerSide;
  opponent: { side: PlayerSide; username: string } | null;
  state: ServerGameState;
}

interface ServerMatchReadyPayload {
  roomId: string;
  players: Array<{ side: PlayerSide; username: string }>;
  state: ServerGameState;
}

interface ServerStatePayload {
  roomId: string;
  state: ServerGameState;
}

interface ServerMatchEndedPayload {
  roomId: string;
  winner: PlayerSide;
  state: ServerGameState;
}

interface ServerErrorPayload {
  message: string;
}

export interface UseWebSocketReturn {
  connectionStatus: ConnectionStatus;
  gameState: ServerGameState | null;
  playerSide: PlayerSide | null;
  players: MatchPlayers | null;
  roomId: string | null;
  winner: PlayerSide | null;
  errorMessage: string | null;
  connect: (username: string) => Promise<void>;
  disconnect: () => void;
  sendInput: (command: InputCommand) => void;
  sendReady: () => void;
  rejoin: (roomId: string, username: string) => void;
}

const mapPlayers = (
  entries: Array<{ side: PlayerSide; username: string }>
): MatchPlayers =>
  entries.reduce<MatchPlayers>(
    (acc, { side, username }) => {
      acc[side] = { username, side };
      return acc;
    },
    {
      left: { username: "Player 1", side: "left" },
      right: { username: "Player 2", side: "right" },
    }
  );

export function useWebSocket(): UseWebSocketReturn {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [gameState, setGameState] = useState<ServerGameState | null>(null);
  const [playerSide, setPlayerSide] = useState<PlayerSide | null>(null);
  const [players, setPlayers] = useState<MatchPlayers | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [winner, setWinner] = useState<PlayerSide | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const usernameRef = useRef<string>("");
  const listenersSetupRef = useRef(false);

  const setupListeners = useCallback(() => {
    const client = WebSocketClient.getInstance();
    const socket = client.getSocket();
    if (!socket || listenersSetupRef.current) return;

    listenersSetupRef.current = true;

    socket.on("server:connected", () => {
      setConnectionStatus("connected");
    });

    socket.on("server:queue", (payload: ServerQueuePayload) => {
      if (payload.status === "waiting") {
        setConnectionStatus("queued");
      } else if (payload.status === "matched") {
        setConnectionStatus("matched");
        if (payload.roomId) {
          setRoomId(payload.roomId);
        }
      }
    });

    socket.on("server:joined", (payload: ServerJoinedPayload) => {
      setRoomId(payload.roomId);
      setPlayerSide(payload.side);
      setGameState(payload.state);

      if (payload.opponent) {
        const mappedPlayers = mapPlayers([
          { side: payload.side, username: usernameRef.current || "You" },
          payload.opponent,
        ]);
        setPlayers(mappedPlayers);
      }

      if (payload.state.status === "playing") {
        setConnectionStatus("playing");
      } else {
        setConnectionStatus("matched");
      }
    });

    socket.on("server:match-ready", (payload: ServerMatchReadyPayload) => {
      const mappedPlayers = mapPlayers(payload.players);
      setPlayers(mappedPlayers);
      setGameState(payload.state);
      setRoomId(payload.roomId);
      setConnectionStatus("matched");
    });

    socket.on("server:match-started", (payload: ServerStatePayload) => {
      setGameState(payload.state);
      setConnectionStatus("playing");
    });

    socket.on("server:state", (payload: ServerStatePayload) => {
      setGameState(payload.state);
      if (payload.state.status === "playing") {
        setConnectionStatus("playing");
      }
    });

    socket.on("server:match-ended", (payload: ServerMatchEndedPayload) => {
      setGameState(payload.state);
      setWinner(payload.winner);
      setConnectionStatus("ended");
    });

    socket.on("server:opponent-left", () => {
      setConnectionStatus("opponent_disconnected");
    });

    socket.on("server:opponent-paused", () => {
      setConnectionStatus("opponent_disconnected");
    });

    socket.on("server:opponent-resumed", () => {
      if (gameState?.status === "playing") {
        setConnectionStatus("playing");
      } else {
        setConnectionStatus("matched");
      }
    });

    socket.on("server:error", (payload: ServerErrorPayload) => {
      setErrorMessage(payload.message);
      setConnectionStatus("error");
    });

    client.onDisconnect((reason) => {
      listenersSetupRef.current = false;
      if (connectionStatus !== "disconnected") {
        setConnectionStatus("error");
        setErrorMessage(`Disconnected: ${reason}`);
      }
    });

    client.onReconnect(() => {
      if (roomId && usernameRef.current) {
        socket.emit("client:rejoin", {
          roomId,
          username: usernameRef.current,
        });
      }
    });
  }, [connectionStatus, gameState?.status, roomId]);

  const connect = useCallback(
    async (username: string) => {
      usernameRef.current = username;
      setConnectionStatus("connecting");
      setErrorMessage(null);
      setWinner(null);

      try {
        const client = WebSocketClient.getInstance();
        await client.connect();
        setupListeners();
        client.emit("client:join", { username });
      } catch (error) {
        console.error("Failed to connect:", error);
        setConnectionStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Connection failed"
        );
      }
    },
    [setupListeners]
  );

  const disconnect = useCallback(() => {
    const client = WebSocketClient.getInstance();
    client.emit("client:leave");
    client.reset();
    listenersSetupRef.current = false;
    setConnectionStatus("disconnected");
    setGameState(null);
    setPlayerSide(null);
    setPlayers(null);
    setRoomId(null);
    setWinner(null);
    setErrorMessage(null);
  }, []);

  const sendInput = useCallback((command: InputCommand) => {
    const client = WebSocketClient.getInstance();
    client.emit("client:input", { command });
  }, []);

  const sendReady = useCallback(() => {
    const client = WebSocketClient.getInstance();
    client.emit("client:ready", { ready: true });
  }, []);

  const rejoin = useCallback((roomId: string, username: string) => {
    usernameRef.current = username;
    const client = WebSocketClient.getInstance();
    client.emit("client:rejoin", { roomId, username });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const client = WebSocketClient.getInstance();
      client.reset();
      listenersSetupRef.current = false;
    };
  }, []);

  return {
    connectionStatus,
    gameState,
    playerSide,
    players,
    roomId,
    winner,
    errorMessage,
    connect,
    disconnect,
    sendInput,
    sendReady,
    rejoin,
  };
}
