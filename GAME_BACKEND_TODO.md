# Game Backend Handlers - TODO

## Overview
The frontend game components are now properly connected to the existing authenticated socket service. However, the backend needs to implement game-specific event handlers.

## Required Backend Event Handlers

Add these handlers to `fastify-ts-app/src/socket/handlers.ts`:

### 1. Matchmaking Events

```typescript
// Client wants to join the matchmaking queue
socket.on('client:join', async (data: { username: string }) => {
    // TODO: Add user to matchmaking queue
    // - Store userId and username in queue
    // - If another player is waiting, match them
    // - Emit 'server:queue' with status: 'waiting' or 'matched'
    // - Create a game room when matched
});

// Client leaves the queue
socket.on('client:leave', async () => {
    // TODO: Remove user from matchmaking queue
});
```

### 2. Game Room Events

```typescript
// Player joins a game room (after being matched)
socket.on('client:rejoin', async (data: { roomId: string; username: string }) => {
    // TODO: Handle reconnection to existing game
    // - Verify room exists
    // - Emit 'server:joined' with game state
});

// Player sends input (paddle movement)
socket.on('client:input', async (data: { command: 'up' | 'down' | 'stop' }) => {
    // TODO: Update player paddle direction
    // - Apply to game physics
    // - Broadcast state updates via 'server:state'
});

// Player is ready to start match
socket.on('client:ready', async (data: { ready: boolean }) => {
    // TODO: Mark player as ready
    // - Check if both players ready
    // - Start game and emit 'server:match-started'
});
```

### 3. Tournament Events

```typescript
// Create tournament
socket.on('client:tournament:create', async (data: { name: string; alias: string; capacity?: number }) => {
    // TODO: Create tournament
    // - Generate unique tournament code
    // - Add creator as first participant
    // - Emit 'server:tournament:created'
});

// Join tournament
socket.on('client:tournament:join', async (data: { code: string; alias: string }) => {
    // TODO: Join existing tournament
    // - Verify tournament exists and has space
    // - Add participant
    // - Broadcast 'server:tournament:snapshot'
});

// Ready to play tournament match
socket.on('client:tournament:ready', async () => {
    // TODO: Mark player ready for tournament match
    // - Check if both match players ready
    // - Start match
});

// Leave tournament
socket.on('client:tournament:leave', async () => {
    // TODO: Remove player from tournament
    // - Handle active match if in progress
    // - Update bracket if needed
});
```

## Server Events to Emit

### Matchmaking
- `server:connected` - Confirmation of connection
- `server:queue` - Queue status update
  ```typescript
  { status: 'waiting' | 'matched', position?: number, roomId?: string }
  ```

### Game State
- `server:joined` - Player joined room
  ```typescript
  { roomId: string, side: 'left' | 'right', state: GameState, opponent?: Player }
  ```
- `server:match-ready` - Both players ready
- `server:match-started` - Game started
- `server:state` - Game state update (60 fps)
  ```typescript
  { ball: Vector2, paddles: { left: PaddleState, right: PaddleState }, score: { left: number, right: number } }
  ```
- `server:match-ended` - Game over
  ```typescript
  { roomId: string, winner: 'left' | 'right', state: GameState }
  ```
- `server:opponent-left` - Opponent disconnected
- `server:error` - Error occurred

### Tournament
- `server:tournament:created` - Tournament created successfully
- `server:tournament:snapshot` - Tournament state update
- `server:tournament:match-started` - Match in tournament started
- `server:tournament:match-ended` - Match in tournament ended
- `server:tournament:completed` - Tournament finished

## Implementation Notes

1. **Game State Management**: Need to maintain game rooms with:
   - Ball position and velocity
   - Paddle positions
   - Scores
   - Player connections

2. **Physics**: Server-authoritative game loop (60 fps)
   - Ball movement and collisions
   - Paddle movement based on input
   - Score tracking

3. **Matchmaking Queue**: Simple FIFO queue
   - Match first two players in queue
   - Create game room
   - Notify both players

4. **Tournament Bracket**: Elimination tournament
   - Track participants and matches
   - Manage bracket progression
   - Handle disconnections gracefully

## Testing Connection

To test if the WebSocket connection works:

```typescript
// In browser console after logging in:
const socket = window.socketService?.socket;
if (socket) {
  console.log('Socket connected:', socket.connected);
  socket.emit('client:join', { username: 'TestPlayer' });
  socket.on('server:queue', (data) => console.log('Queue status:', data));
}
```

## Status

✅ Frontend socket connection fixed - uses existing authenticated socket on port 3000
❌ Backend game handlers - need to be implemented
❌ Game physics server - need to implement server-side game loop
❌ Tournament management - need to implement bracket and match tracking
