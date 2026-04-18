# Architecture Guide

## System Overview

```
┌─────────────────┐         ┌─────────────────┐
│   Browser Tab 1 │         │   Browser Tab 2 │
│   (User A)      │         │   (User B)      │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │   WebSocket               │ WebSocket
         │   (Signaling)             │ (Signaling)
         │                           │
         └───────────────┬───────────┘
                         │
                  ┌──────▼──────┐
                  │    Node.js  │
                  │   Server    │
                  │  (Express)  │
                  └─────────────┘
         
         ▼──────────────────────────────────────▼
    WebRTC Peer Connection (P2P Voice)
         User A ◄────────► User B
```

## Key Components

### 1. Backend (server/index.js)

**Responsibilities:**
- User lifecycle management (join, queue, pair, leave)
- Matchmaking/pairing logic
- WebSocket signaling for WebRTC
- Message routing between peers

**Key Data Structures:**
```
users: Map(userId -> {ws, username, status, pairId})
waitingQueue: Map(userId -> {username, joinedAt})
pairs: Map(pairId -> {user1Id, user2Id, status, gameId, selectedGame})
```

**Message Types Handled:**
- `JOIN_LOBBY` - User joins lobby
- `QUEUE_FOR_MATCH` - User enters matching queue
- `CANCEL_QUEUE` - User leaves queue
- `SELECT_GAME` - User selects a game
- `START_GAME` - Initiates game start
- `OFFER`/`ANSWER`/`ICE_CANDIDATE` - WebRTC signaling
- `LEAVE_PAIR` - User disconnects

### 2. Frontend (main.js)

**Responsibilities:**
- Screen/UI state management
- WebSocket client communication
- WebRTC peer connection establishment
- Local and remote audio stream handling
- User interactions

**Key State Variables:**
```
userId              # Unique user identifier
pairId              # Current pair identifier
partnerId           # Connected partner's user ID
peerConnection      # RTCPeerConnection object
localStream         # Local audio stream
remoteStream        # Remote audio stream
selectedGame        # Selected game
gameId              # Current game identifier
```

**Screen Flow:**
```
Lobby → Queue → Game Selection → Game (Voice Chat Active)
  ↓       ↓           ↓              ↓
 Join   Wait       Choose        Play
```

### 3. Frontend UI (index.html & style.css)

**Screens:**
1. **Lobby Screen** - Join interface
2. **Queue Screen** - Waiting for partner
3. **Game Selection Screen** - Choose game
4. **Game Screen** - Active gameplay with voice chat

## Communication Flow

### Sequence: User A joins and pairs with User B

```
1. User A connects
   Client A ──(WebSocket: JOIN_LOBBY)──> Server
   Server ──(JOINED_LOBBY + userId)──> Client A

2. User B connects  
   Client B ──(WebSocket: JOIN_LOBBY)──> Server
   Server ──(JOINED_LOBBY + userId)──> Client B
   Server ──(USER_COUNT: 2)──> All Clients

3. User A queues
   Client A ──(QUEUE_FOR_MATCH)──> Server
   Server ──(QUEUED)──> Client A
   Server ──(QUEUE_UPDATED: 1)──> All Clients

4. User B queues
   Client B ──(QUEUE_FOR_MATCH)──> Server
   Server ──(QUEUED)──> Client B
   Server ──(QUEUE_UPDATED: 2)──> All Clients

5. Server pairs users (automatic when queue >= 2)
   Server ──(PAIRED + games list)──> Client A
   Server ──(PAIRED + games list)──> Client B

6. Users select game
   Client A ──(SELECT_GAME: Chess)──> Server ──(GAME_SELECTED)──> Client B
   Client B ──(SELECT_GAME: Chess)──> Server ──(GAME_SELECTED)──> Client A

7. User A starts game
   Client A ──(START_GAME)──> Server ──(GAME_STARTED)──> Client B
   
8. WebRTC Signaling (P2P connection)
   Client A ──(OFFER)──> Server ──> Client B
   Client B ──(ANSWER)──> Server ──> Client A
   Clients ◄──(ICE_CANDIDATES)──> Exchange via Server
   
9. Direct P2P Connection Established
   Audio Stream A ◄────────────► Audio Stream B
   (No server involved after this point)
```

## WebRTC Peer Connection Flow

### Initiator (User A)

```
1. getUserMedia() → Get local microphone
2. Create RTCPeerConnection
3. addTrack() → Add local audio to peer connection
4. createOffer() → Generate SDP offer
5. setLocalDescription() → Set local offer
6. Send OFFER via WebSocket signaling
7. Receive ANSWER via WebSocket
8. setRemoteDescription() → Set remote answer
9. Exchange ICE candidates
10. ontrack event → Receive remote stream
11. P2P connection established ✓
```

### Non-Initiator (User B)

```
1. getUserMedia() → Get local microphone
2. Create RTCPeerConnection
3. addTrack() → Add local audio to peer connection
4. Receive OFFER via WebSocket
5. setRemoteDescription() → Set remote offer
6. createAnswer() → Generate SDP answer
7. setLocalDescription() → Set local answer
8. Send ANSWER via WebSocket signaling
9. Exchange ICE candidates
10. ontrack event → Receive remote stream
11. P2P connection established ✓
```

## Matchmaking Algorithm

```javascript
attemptPairing() {
  if (waitingQueue.size < 2) return;
  
  // Get first two waiting users
  user1 = waitingQueue.get(firstId);
  user2 = waitingQueue.get(secondId);
  
  // Remove from queue
  waitingQueue.delete(user1Id);
  waitingQueue.delete(user2Id);
  
  // Create pair record
  pair = {
    user1Id, user2Id,
    status: 'selecting_game',
    selectedGame: null
  }
  
  // Update user records
  user1.pairId = pairId;
  user2.pairId = pairId;
  user1.status = 'paired';
  user2.status = 'paired';
}
```

**Current Behavior:** FIFO (First In First Out)
**Possible Enhancements:**
- Rating-based matching
- Skill-level matching
- Region/language preference
- Time-based weighting

## Network Architecture

### Local Testing
```
Browser Tabs on Same Machine
         ↓
    localhost:3000 (Express Server)
         ↓
    Same machine (direct WebRTC possible)
```

### Internet Testing
```
User A (Network 1) ──┐
                     ├─> Server ──> STUN Server
User B (Network 2) ──┘        │
                         (NAT Traversal)
                              ↓
                    P2P Connection via NAT
```

### STUN Servers Used
- `stun.l.google.com:19302`
- `stun1.l.google.com:19302`

### Production Deployment
For better NAT traversal, add TURN server:
```javascript
const configuration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302'] },
    { urls: ['turn:turnserver.com'], username: 'user', credential: 'pass' }
  ]
};
```

## Error Handling

### Frontend Error Scenarios

1. **Microphone Access Denied**
   - User rejects permission
   - Solution: Guide user to browser settings

2. **WebRTC Connection Fails**
   - NAT traversal fails
   - No compatible codecs
   - Solution: Check console, try TURN server

3. **Partner Disconnects**
   - Partner closes browser
   - Network failure
   - Solution: Prompt return to lobby

4. **Server Disconnects**
   - Server crashes
   - Network issue
   - Solution: Attempt reconnection with exponential backoff

### Backend Error Scenarios

1. **Invalid Message Format**
   - Malformed JSON
   - Missing required fields
   - Solution: Validation and error logging

2. **User Not Found**
   - User disconnected
   - Stale reference
   - Solution: Graceful cleanup

3. **Pair State Invalid**
   - Attempting operation in wrong state
   - Solution: State validation before operations

## Performance Considerations

### Scalability Limits (Single Server)
- **WebSocket Connections**: ~65,000 (OS limits)
- **Peer Connections**: Limited by CPU/bandwidth
- **Recommended**: 1,000-5,000 concurrent users

### Optimization Strategies
1. **Horizontal Scaling**: Multiple servers with load balancer
2. **Signaling Proxy**: Separate signaling server from game logic
3. **Database**: Persist user/game data
4. **Caching**: Redis for queue management
5. **Audio Optimization**: Codec selection, bitrate control

### Current Limitations
- All state in memory (lost on server restart)
- No persistent storage
- Single server only
- No horizontal scaling

## Security Considerations

### Current Implementation
- No authentication
- No rate limiting
- No input validation
- WebSocket unencrypted (HTTP)

### Production Recommendations
1. **HTTPS/WSS**: Use secure WebSocket
2. **Authentication**: JWT tokens
3. **Rate Limiting**: Prevent abuse
4. **Input Validation**: Sanitize all inputs
5. **CORS**: Restrict origins
6. **Content Security Policy**: Prevent XSS
7. **DDoS Protection**: Rate limiting, firewalls

## Game Integration

### Adding a New Game

1. **Add game to GAMES array** (server/index.js)
   ```javascript
   const GAMES = [..., 'My Game'];
   ```

2. **Create game component** (main.js)
   ```javascript
   function initializeGame(game, pairId) {
     const gameArea = document.getElementById('game-area');
     
     switch(game) {
       case 'My Game':
         gameArea.innerHTML = '<div>Game Board</div>';
         // Initialize game logic
         break;
     }
   }
   ```

3. **Send game state updates**
   ```javascript
   sendMessage({
     type: 'GAME_UPDATE',
     move: moveData
   });
   ```

4. **Handle partner's moves**
   ```javascript
   case 'GAME_UPDATE':
     handleGameMove(message.move);
     break;
   ```

## Monitoring & Debugging

### Browser Console Tips
```javascript
// Inspect peer connection state
console.log(peerConnection.connectionState);

// Check ICE connection state
console.log(peerConnection.iceConnectionState);

// Monitor audio levels
console.log(remoteAudio.volume);

// Check WebSocket state
console.log(ws.readyState); // 0=connecting, 1=open, 2=closing, 3=closed
```

### Server Logging
```javascript
// Enable detailed logging
console.log(`[User ${userId}] Connected`);
console.log(`[Pair ${pairId}] Status: ${pair.status}`);
console.log(`[Queue] Size: ${waitingQueue.size}`);
```

## Future Enhancements

1. **Multi-Player Games** - 3+ players per game
2. **Video Chat** - Add video option
3. **Screen Sharing** - Share game board visually
4. **Persistent Scores** - Database integration
5. **Tournaments** - Bracket system
6. **Spectators** - Watch ongoing games
7. **Mobile App** - React Native version
8. **Mobile Responsive** - Better mobile UI
9. **Accessibility** - Screen reader support
10. **Localization** - Multi-language support
