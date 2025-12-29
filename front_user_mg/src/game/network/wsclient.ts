import { io, type Socket } from "socket.io-client";

type EventHandler = (...args: unknown[]) => void;
type OnceHandler = (...args: unknown[]) => void;

const runtimeHostname =
  typeof window !== "undefined" && window.location?.hostname
    ? window.location.hostname
    : "localhost";

const runtimeDefaultUrl = `http://${runtimeHostname}:3001`;

const envServerUrl = (() => {
  try {
    return import.meta.env?.VITE_GAME_SERVER_URL ?? null;
  } catch {
    return null;
  }
})();

const isLocalHost = (value?: string | null) => {
  if (!value) {
    return false;
  }
  const normalized = value.toLowerCase();
  return ["localhost", "127.0.0.1", "::1"].some((token) =>
    normalized.includes(token)
  );
};

const DEFAULT_SERVER_URL =
  isLocalHost(envServerUrl) && !isLocalHost(runtimeHostname)
    ? runtimeDefaultUrl
    : envServerUrl ?? runtimeDefaultUrl;

const MAX_PENDING_QUEUE = 32;

export class WebSocketClient {
  private static instance: WebSocketClient;
  private socket: Socket | null = null;
  private connectPromise: Promise<Socket> | null = null;
  private serverUrl: string = DEFAULT_SERVER_URL;
  private reconnectCallbacks = new Set<() => void>();
  private disconnectCallbacks = new Set<(reason: string) => void>();
  private hasEverConnected = false;
  private pendingQueue: Array<{ event: string; payload?: unknown }> = [];

  private constructor() {}

  public static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  public async connect(url?: string): Promise<Socket> {
    const targetUrl = url ?? this.serverUrl;
    if (this.socket?.connected) {
      return this.socket;
    }
    if (!this.connectPromise) {
      this.serverUrl = targetUrl;
      this.connectPromise = new Promise<Socket>((resolve, reject) => {
        const socket = io(targetUrl, {
          autoConnect: false,
          transports: ["websocket"],
          withCredentials: true,
        });

        const cleanup = () => {
          socket.off("connect", handleConnect);
          socket.off("connect_error", handleError);
        };

        const handleConnect = () => {
          cleanup();
          this.socket = socket;
          this.connectPromise = null;
          const isReconnect = this.hasEverConnected;
          this.hasEverConnected = true;
          this.flushQueue();
          if (isReconnect) {
            this.runHandlers(this.reconnectCallbacks, [] as [], "reconnect");
          }
          resolve(socket);
        };

        const handleError = (err: Error) => {
          cleanup();
          socket.disconnect();
          this.connectPromise = null;
          reject(err);
        };

        socket.once("connect", handleConnect);
        socket.once("connect_error", handleError);
        socket.connect();
        socket.on("disconnect", (reason: string) => {
          if (this.socket === socket) {
            this.socket = null;
          }
          this.runHandlers(this.disconnectCallbacks, [reason], "disconnect");
        });
      });
    }

    return this.connectPromise;
  }

  public emit = (event: string, payload?: unknown): void => {
    if (this.socket?.connected) {
      this.socket.emit(event, payload);
      return;
    }
    this.enqueue(event, payload);
    void this.connect().catch((error) => {
      console.warn("Failed to connect for queued emit", error);
    });
  };

  public on = (event: string, handler: EventHandler): void => {
    this.socket?.on(event, handler);
  };

  public once = (event: string, handler: OnceHandler): void => {
    this.socket?.once(event, handler);
  };

  public off = (event: string, handler: EventHandler): void => {
    this.socket?.off(event, handler);
  };

  public getSocket(): Socket | null {
    return this.socket;
  }

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  public reset(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectPromise = null;
    this.pendingQueue = [];
  }

  public onDisconnect(handler: (reason: string) => void): () => void {
    this.disconnectCallbacks.add(handler);
    return () => this.disconnectCallbacks.delete(handler);
  }

  public onReconnect(handler: () => void): () => void {
    this.reconnectCallbacks.add(handler);
    return () => this.reconnectCallbacks.delete(handler);
  }

  private runHandlers<Args extends unknown[]>(
    handlers: Set<(...args: Args) => void>,
    args: Args,
    label: string
  ): void {
    for (const handler of handlers) {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Failed to run ${label} handler`, error);
      }
    }
  }

  private enqueue(event: string, payload?: unknown): void {
    if (this.pendingQueue.length >= MAX_PENDING_QUEUE) {
      this.pendingQueue.shift();
    }
    this.pendingQueue.push({ event, payload });
  }

  private flushQueue(): void {
    if (!this.socket?.connected || this.pendingQueue.length === 0) {
      return;
    }
    const queue = [...this.pendingQueue];
    this.pendingQueue = [];
    for (const { event, payload } of queue) {
      try {
        this.socket.emit(event, payload);
      } catch (error) {
        console.error("Failed to flush queued event", { event, error });
      }
    }
  }
}
