# Integration Notes

## What Was Merged

This document details the integration of the Pong game and tournament system from `mastax/ft_PingPong` (commit `87f5db9`) into the existing user management, friends, and chat system.

### Game Module
- **Pong Game Logic** (`fastify-ts-app/src/game/gameLogic.ts`): Core physics, paddle movement, ball collision, scoring
- **Match Rooms** (`fastify-ts-app/src/game/gameRoom.ts`): Real-time game rooms with Socket.IO, reconnection handling
- **Matchmaking** (`fastify-ts-app/src/game/matchmaking.ts`): Queue system for pairing players

### Tournament System
- **Tournament Management** (`fastify-ts-app/src/tournament/tournament.ts`): State machine for tournament lifecycle
- **Bracket Generation** (`fastify-ts-app/src/tournament/bracket.ts`): Single-elimination bracket creation and progression
- **Tournament Registry** (`fastify-ts-app/src/tournament/registry.ts`): Global tournament manager with Socket.IO integration
- **Utilities** (`fastify-ts-app/src/tournament/utils.ts`): Code generation, alias creation, capacity validation

### Database
- **Match Storage** (`fastify-ts-app/src/db/matchStorage.ts`): Persistence for matches and players
- **Tournament Storage** (`fastify-ts-app/src/db/tournamentStorage.ts`): Persistence for tournaments and participants

### Frontend
- **Game Components** (`front_user_mg/src/game/`): Canvas rendering, input handling, game state management
- **Tournament Components** (`front_user_mg/src/tournament/`): Lobby, bracket view, participant management
- **Pages** (`front_user_mg/src/pages/`): Game and Tournament routes

## Database Schema

### New Tables

#### `matches`
Stores game match metadata:
- `id` (TEXT PRIMARY KEY): Unique match identifier
- `status` (TEXT): 'waiting', 'playing', 'finished'
- `game_type` (TEXT): 'pong' (extensible for future games)
- `state_json` (TEXT): Serialized game state
- `rejoin_deadline` (INTEGER): Timestamp for reconnection deadline
- `created_at`, `updated_at` (INTEGER): Timestamps

#### `match_players`
Links players to matches with their game state:
- `match_id` (TEXT): References `matches(id)`
- `side` (TEXT): 'left' or 'right'
- `user_id` (INTEGER): References `users(id)` ← **Integration point**
- `ready` (INTEGER): Boolean flag for ready state
- `connected` (INTEGER): Boolean flag for connection status
- `last_seen` (INTEGER): Timestamp of last activity

#### `tournaments`
Stores tournament metadata:
- `code` (TEXT PRIMARY KEY): 6-character tournament code
- `name` (TEXT): Tournament name
- `status` (TEXT): 'waiting', 'in_progress', 'finished'
- `capacity` (INTEGER): Max participants (power of 2)
- `created_at`, `updated_at` (INTEGER): Timestamps
- `state_json` (TEXT): Full tournament state

#### `tournament_participants`
Links users to tournaments:
- `tournament_code` (TEXT): References `tournaments(code)`
- `user_id` (INTEGER): References `users(id)` ← **Integration point**
- `alias` (TEXT): Player's tournament alias
- `eliminated` (INTEGER): Boolean elimination flag
- `placement` (INTEGER): Final placement (1st, 2nd, etc.)

### Indexes
- `idx_match_players_user_id`: Fast lookup of user's matches
- `idx_match_players_match_id`: Fast lookup of match participants
- `idx_matches_game_type`: Filter by game type
- `idx_tournament_participants_user_id`: Fast lookup of user's tournaments

### Foreign Key Relationships
```
users (id) ←─┬─ match_players (user_id)
             └─ tournament_participants (user_id)

matches (id) ← match_players (match_id)
tournaments (code) ← tournament_participants (tournament_code)
```

## Socket Event Flow

### Authentication
All socket connections use JWT authentication via `socketAuthMiddleware`. The token is passed in the `auth` object during connection:
```typescript
io(SOCKET_URL, { auth: { token }, transports: ['websocket'] })
```

### Game Events

#### Client → Server
- `client:join`: Join matchmaking queue
  - Response: `server:queue` with status 'waiting' or 'matched'
- `client:leave-queue`: Leave matchmaking queue
- `client:ready`: Mark ready to start game
- `client:input`: Send paddle input (`{ command: 'up' | 'down' | 'stop' }`)

#### Server → Client
- `server:queue`: Queue status update
  - `{ status: 'waiting', position: number }`: Waiting for opponent
  - `{ status: 'matched', roomId: string }`: Match found
- `server:match-ready`: Match room created
  - `{ roomId: string, players: PlayerInfo[] }`
- `server:game-start`: Both players ready, game starting
- `server:state`: Game state update (60 FPS)
  - `GameState` object with paddles, ball, score
- `server:match-ended`: Game finished
  - `{ winner: number, loser: number, score: {...}, forfeit?: boolean }`
- `server:player-disconnected`: Player lost connection
  - `{ userId: number, deadline: number }`

### Tournament Events

#### Client → Server
- `client:tournament:create`: Create new tournament
  - `{ name: string, alias: string, capacity: number }`
- `client:tournament:join`: Join existing tournament
  - `{ code: string, alias: string }`
- `client:tournament:leave`: Leave tournament (waiting only)
  - `{ code: string }`
- `client:tournament:start`: Start tournament (creator only)
  - `{ code: string }`
- `client:tournament:list`: Request active tournaments

#### Server → Client
- `server:tournament:created`: Tournament created successfully
  - `{ code: string, state: TournamentState }`
- `server:tournament:joined`: Joined tournament successfully
  - `{ code: string, state: TournamentState }`
- `tournament:update`: Tournament state changed
  - `{ code: string, state: TournamentState }`
- `tournament:match-ready`: Match ready in tournament
  - `{ tournamentCode: string, matchId: string, player1: number, player2: number, round: number }`
- `tournament:finished`: Tournament complete
  - `{ code: string, champion: ParticipantInfo }`
- `server:tournament:list`: List of active tournaments
  - `TournamentState[]`

### Integration with Existing Events
The game handlers are registered **after** authentication in the same socket connection:
```typescript
// In socket/handlers.ts
if (userId) {
    // Existing friend/chat handlers...
    registerGameHandlers(io, socket, userId, username);
}
```

This ensures:
- Single socket connection per user
- Game events respect authentication
- Friend status updates work during games (e.g., "in-game" status)

## User Flow Examples

### Quick Match Flow
1. User logs in → JWT token issued
2. User navigates to `/game` → `PongGame` component mounts
3. User clicks "Join Queue" → `client:join` emitted
4. Server matches with opponent → `server:queue` with status 'matched'
5. `server:match-ready` sent with room and player info
6. User clicks "Ready" → `client:ready` emitted
7. Both ready → `server:game-start` sent
8. Game loop starts → `server:state` emitted every 16ms
9. User presses arrow keys → `client:input` emitted
10. Game ends → `server:match-ended` with winner
11. Match saved to `matches` and `match_players` tables

### Tournament Flow
1. User navigates to `/tournament`
2. User clicks "Create Tournament" → Form appears
3. User enters name, alias, capacity → `client:tournament:create` emitted
4. Server creates tournament → `server:tournament:created` with code
5. Other users join via code → `client:tournament:join`
6. All participants see updates → `tournament:update`
7. Creator starts → `client:tournament:start`
8. Server generates bracket → `tournament:match-ready` for first round
9. Winners advance → `tournament:match-ready` for next round
10. Final match completes → `tournament:finished`
11. Tournament state saved to `tournaments` and `tournament_participants`

### Reconnection Flow
1. Player disconnects during game → `handleDisconnect` triggered
2. Game pauses → `rejoin_deadline` set to +30 seconds
3. `server:player-disconnected` sent to opponent
4. If player reconnects → Game resumes
5. If deadline passes → Opponent wins by forfeit
6. Match updated with forfeit flag

## Integration with Existing Features

### Friends System
- When a user joins a game, their status updates to "in-game"
- Friends see the status change via `friend_status_change` event
- Game invites from `game_invites` table can be linked to match creation (future enhancement)

### Chat System
- Game invite messages already exist in the chat
- Clicking an invite can navigate to `/game` and auto-join a specific match (future enhancement)
- Tournament codes can be shared via chat

### User Authentication
- All game/tournament events require authenticated JWT token
- `user_id` from token is used for database foreign keys
- Ensures users can only control their own paddle/actions

## Known Issues / TODOs

### High Priority
- [ ] Link `game_invites` table to match creation (currently separate flows)
- [ ] Add reconnection UI feedback (timer, reconnect button)
- [ ] Handle tournament bracket visualization (currently just text)

### Medium Priority
- [ ] Add match history page (query from `matches` + `match_players`)
- [ ] Add tournament history page (query from `tournaments`)
- [ ] Add leaderboard (aggregate wins/losses from `match_players`)
- [ ] Add spectator mode (join game room as observer)

### Low Priority
- [ ] Add tournament bracket SVG rendering
- [ ] Add game replay system (store full state history)
- [ ] Add power-ups or game variations
- [ ] Add tournament customization (best-of-3, different capacities)

## Future Enhancements

### Game Invite Integration
Currently, game invites are a separate system. To integrate:
1. When a game invite is accepted, create a match room directly
2. Pass both players' socket IDs to `roomManager.createRoom()`
3. Skip matchmaking queue
4. Update `game_invites.game_id` with the match ID

### Statistics & Leaderboard
```sql
-- Example: Get user win/loss record
SELECT 
    COUNT(*) as total_matches,
    SUM(CASE WHEN winner = ? THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN winner != ? THEN 1 ELSE 0 END) as losses
FROM matches m
JOIN match_players mp ON m.id = mp.match_id
WHERE mp.user_id = ? AND m.status = 'finished'
```

### Tournament Types
The current system supports single-elimination. Future types:
- Double-elimination (loser's bracket)
- Round-robin (everyone plays everyone)
- Swiss system (pair by rank each round)

## Technical Decisions

### Why Single Socket Connection?
We reuse the existing authenticated socket connection because:
- Simplifies authentication (one JWT verification)
- Reduces connection overhead
- Enables cross-feature events (e.g., friend status during game)

### Why Store Full State in JSON?
The `state_json` fields store complete game/tournament state because:
- Easy serialization/deserialization
- Flexible schema (game rules can change)
- Simplifies reconnection (load full state instantly)
- Trade-off: Harder to query specific fields (use computed columns if needed)

### Why Better-SQLite3?
Both modules use `better-sqlite3` (synchronous) because:
- Fastify already uses it
- Synchronous API simplifies transaction logic
- Good performance for local database
- Trade-off: Not suitable for distributed systems (use PostgreSQL for production)

## Testing

### Manual Testing Checklist
- [ ] User can log in and JWT is issued
- [ ] User can join matchmaking queue
- [ ] Two users can be matched and play a game
- [ ] Game state updates in real-time
- [ ] Paddle controls work (arrow keys/WASD)
- [ ] Score increments correctly
- [ ] Game ends when player reaches 5 points
- [ ] Match result is saved to database
- [ ] User can create a tournament
- [ ] Multiple users can join a tournament
- [ ] Tournament can be started
- [ ] Bracket matches are created
- [ ] Tournament progresses through rounds
- [ ] Tournament completes and winner is determined

### Database Testing
```bash
# Check if tables were created
sqlite3 DATABASE.db ".tables"
# Should see: matches, match_players, tournaments, tournament_participants

# Check if foreign keys work
sqlite3 DATABASE.db "PRAGMA foreign_keys;"
# Should return: 1

# View match data
sqlite3 DATABASE.db "SELECT * FROM matches LIMIT 5;"
sqlite3 DATABASE.db "SELECT * FROM match_players LIMIT 5;"
```

### Socket Testing
Use browser console to monitor events:
```javascript
// In browser console
socket.onAny((event, ...args) => {
    console.log('Socket event:', event, args);
});
```

## Performance Considerations

### Game Loop Optimization
- Game state updates run at 60 FPS (every 16ms)
- Only broadcast state, not individual updates
- Use `setInterval` for consistent timing
- Clear interval when game ends

### Database Write Frequency
- Matches: Write on create, update on key events (pause, end)
- Tournaments: Write on create, participant join/leave, state changes
- Avoid writing every game state update (too frequent)

### Scalability Limits
Current implementation is single-server:
- All state is in-memory (`Map` objects)
- Database is local SQLite file
- Socket.IO uses default in-memory adapter

For multi-server:
- Use Redis for shared state
- Use PostgreSQL for database
- Use Socket.IO Redis adapter for cross-server events

## Security Considerations

### JWT Verification
All socket events verify JWT token on connection:
```typescript
io.use(socketAuthMiddleware(server));
```

### Input Validation
Game handlers validate:
- User is in the match they're trying to control
- Commands are valid enums ('up', 'down', 'stop')
- Tournament codes exist before joining
- User is authenticated before creating tournaments

### SQL Injection Prevention
All database queries use prepared statements:
```typescript
db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
```

### Cheating Prevention
Current limitations:
- Client sends input, server computes state (good)
- No validation of input frequency (can spam)
- No server-side replay validation (trust client timing)

Improvements needed:
- Rate limit input commands
- Server-side input validation (e.g., max paddle speed)
- Record input timestamps for replay validation

## Deployment Notes

### Environment Variables
None required currently. Future:
- `DATABASE_PATH`: Path to SQLite database
- `MATCH_EXPIRY_TIME`: Time before matches are pruned (default: 5 minutes)
- `REJOIN_DEADLINE`: Time to reconnect before forfeit (default: 30 seconds)

### Database Migration
On startup, all tables are created if not exist. To reset:
```bash
rm DATABASE.db
# Restart server - tables will be recreated
```

### Build Process
```bash
# Backend
cd fastify-ts-app
npm install
npm run build

# Frontend
cd front_user_mg
npm install
npm run build
```

### Health Check
```bash
# Check if server is running
curl http://localhost:3000/

# Check if Socket.IO is accessible
curl http://localhost:3000/socket.io/
```

## Credits

- **Source Repository**: mastax/ft_PingPong (commit 87f5db9)
- **Integration by**: GitHub Copilot
- **Integration Date**: 2025-12-29

## References

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Better-SQLite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [Fastify Documentation](https://fastify.dev/)
- [React Router Documentation](https://reactrouter.com/)
