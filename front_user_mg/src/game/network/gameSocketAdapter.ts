import { socketService } from '../../services/socket';
import type { Socket } from 'socket.io-client';

/**
 * GameSocketAdapter - Bridges the game module with the existing authenticated socket
 * 
 * This adapter allows game components to use the existing socket connection
 * instead of creating a new one via wsclient.ts
 */
export class GameSocketAdapter {
  private static instance: GameSocketAdapter;
  private reconnectCallbacks = new Set<() => void>();
  private disconnectCallbacks = new Set<(reason: string) => void>();
  private listenersSetup = false;
  private disconnectHandler?: (reason: string) => void;
  private connectHandler?: () => void;

  private constructor() {
    // Don't setup listeners here - wait until connect() is called
  }

  public static getInstance(): GameSocketAdapter {
    if (!GameSocketAdapter.instance) {
      GameSocketAdapter.instance = new GameSocketAdapter();
    }
    return GameSocketAdapter.instance;
  }

  private setupListeners(): void {
    // Only setup once
    if (this.listenersSetup) {
      return;
    }

    // Ensure socket is connected
    if (!socketService.socket) {
      socketService.connect();
    }

    if (socketService.socket) {
      // Store handlers so we can remove them later
      this.disconnectHandler = (reason: string) => {
        this.runHandlers(this.disconnectCallbacks, [reason], 'disconnect');
      };

      this.connectHandler = () => {
        this.runHandlers(this.reconnectCallbacks, [], 'reconnect');
      };

      socketService.socket.on('disconnect', this.disconnectHandler);
      socketService.socket.on('connect', this.connectHandler);
      this.listenersSetup = true;
    }
  }

  public async connect(): Promise<Socket> {
    this.setupListeners();

    // Use existing socket connection
    if (!socketService.socket || !socketService.socket.connected) {
      socketService.connect();
    }

    // Return a promise that resolves when connected
    return new Promise((resolve, reject) => {
      if (socketService.socket?.connected) {
        resolve(socketService.socket);
        return;
      }

      const maxAttempts = 50; // 5 seconds max wait
      let attempts = 0;
      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, 5000);

      const checkConnection = () => {
        attempts++;
        if (socketService.socket?.connected) {
          clearTimeout(timeout);
          resolve(socketService.socket);
        } else if (attempts >= maxAttempts) {
          clearTimeout(timeout);
          reject(new Error('Socket connection timeout after max attempts'));
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  public emit(event: string, payload?: unknown): void {
    if (socketService.socket?.connected) {
      socketService.socket.emit(event, payload);
    } else {
      console.warn(`Socket not connected, cannot emit event: ${event}`);
      // Attempt to reconnect
      socketService.connect();
    }
  }

  public on(event: string, handler: (...args: unknown[]) => void): void {
    if (socketService.socket) {
      socketService.socket.on(event, handler);
    }
  }

  public once(event: string, handler: (...args: unknown[]) => void): void {
    if (socketService.socket) {
      socketService.socket.once(event, handler);
    }
  }

  public off(event: string, handler: (...args: unknown[]) => void): void {
    if (socketService.socket) {
      socketService.socket.off(event, handler);
    }
  }

  public getSocket(): Socket | null {
    return socketService.socket;
  }

  public isConnected(): boolean {
    return socketService.socket?.connected ?? false;
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

  public reset(): void {
    // Clean up event listeners
    if (socketService.socket && this.listenersSetup) {
      if (this.disconnectHandler) {
        socketService.socket.off('disconnect', this.disconnectHandler);
      }
      if (this.connectHandler) {
        socketService.socket.off('connect', this.connectHandler);
      }
    }

    // Don't disconnect the main socket, just clean up game-specific listeners
    this.reconnectCallbacks.clear();
    this.disconnectCallbacks.clear();
    this.listenersSetup = false;
    this.disconnectHandler = undefined;
    this.connectHandler = undefined;
  }
}
