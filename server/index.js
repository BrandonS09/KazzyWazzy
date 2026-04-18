import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, '../dist')));
app.use(express.json());

// CORS - needed because Vercel frontend calls Render backend API
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ICE server configuration endpoint
// Returns STUN + TURN servers. TURN credentials come from environment variables.
app.get('/api/ice-servers', (req, res) => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ];

  // Add TURN server if credentials are configured via env vars
  const turnUrls = process.env.TURN_URLS;
  const turnUsername = process.env.TURN_USERNAME;
  const turnCredential = process.env.TURN_CREDENTIAL;

  if (turnUrls && turnUsername && turnCredential) {
    // Support comma-separated TURN URLs
    const urls = turnUrls.split(',').map(u => u.trim());
    iceServers.push({
      urls,
      username: turnUsername,
      credential: turnCredential
    });
    console.log('TURN server configured:', urls);
  } else {
    console.log('No TURN server configured - cross-network voice chat may not work');
  }

  res.json({ iceServers });
});

// Game types available
const GAMES = [
  'Tic Tac Toe',
  'Connect Four',
  'Trivia',
  'Word Battle',
  'Rock Paper Scissors',
  'Number Guessing'
];

// User management
const users = new Map(); // userId -> { ws, username, status, gameId }
const pairs = new Map(); // pairId -> { user1Id, user2Id, status, gameId, selectedGame }
const waitingQueue = new Map(); // userId -> { username, joinedAt }

// Handle new WebSocket connections
wss.on('connection', (ws) => {
  const userId = uuidv4();
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(userId, ws, message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    handleUserDisconnect(userId);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleMessage(userId, ws, message) {
  switch (message.type) {
    case 'JOIN_LOBBY':
      handleJoinLobby(userId, ws, message);
      break;
    case 'QUEUE_FOR_MATCH':
      handleQueueForMatch(userId, message);
      break;
    case 'CANCEL_QUEUE':
      handleCancelQueue(userId);
      break;
    case 'SELECT_GAME':
      handleSelectGame(userId, message);
      break;
    case 'START_GAME':
      handleStartGame(userId, message);
      break;
    case 'ICE_CANDIDATE':
      handleICECandidate(userId, message);
      break;
    case 'OFFER':
      handleOffer(userId, message);
      break;
    case 'ANSWER':
      handleAnswer(userId, message);
      break;
    case 'GAME_MOVE':
      handleGameMove(userId, message);
      break;
    case 'LEAVE_PAIR':
      handleLeavePair(userId);
      break;
  }
}

function handleJoinLobby(userId, ws, message) {
  const username = message.username || `User${userId.slice(0, 6)}`;
  
  users.set(userId, {
    ws,
    username,
    status: 'lobby',
    gameId: null,
    pairId: null
  });

  ws.send(JSON.stringify({
    type: 'JOINED_LOBBY',
    userId,
    games: GAMES
  }));

  broadcast({
    type: 'USER_COUNT',
    count: users.size
  });
}

function handleQueueForMatch(userId, message) {
  const user = users.get(userId);
  if (!user) return;

  user.status = 'queued';
  waitingQueue.set(userId, {
    username: user.username,
    joinedAt: Date.now()
  });

  user.ws.send(JSON.stringify({
    type: 'QUEUED',
    queuePosition: waitingQueue.size
  }));

  // Try to pair users if queue has at least 2
  if (waitingQueue.size >= 2) {
    attemptPairing();
  }

  broadcast({
    type: 'QUEUE_UPDATED',
    queueSize: waitingQueue.size
  });
}

function attemptPairing() {
  if (waitingQueue.size < 2) return;

  const [user1Id] = waitingQueue.entries().next().value;
  const [user2Id] = [...waitingQueue.entries()][1];

  const pairId = uuidv4();
  const user1 = users.get(user1Id);
  const user2 = users.get(user2Id);

  if (!user1 || !user2) return;

  // Remove from queue
  waitingQueue.delete(user1Id);
  waitingQueue.delete(user2Id);

  // Create pair
  pairs.set(pairId, {
    user1Id,
    user2Id,
    status: 'selecting_game',
    gameId: null,
    selectedGame: null
  });

  user1.pairId = pairId;
  user2.pairId = pairId;
  user1.status = 'paired';
  user2.status = 'paired';

  // Notify both users of pairing
  user1.ws.send(JSON.stringify({
    type: 'PAIRED',
    pairId,
    partnerUsername: user2.username,
    partnerId: user2Id,
    games: GAMES
  }));

  user2.ws.send(JSON.stringify({
    type: 'PAIRED',
    pairId,
    partnerUsername: user1.username,
    partnerId: user1Id,
    games: GAMES
  }));

  broadcast({
    type: 'QUEUE_UPDATED',
    queueSize: waitingQueue.size
  });
}

function handleCancelQueue(userId) {
  const user = users.get(userId);
  if (!user) return;

  waitingQueue.delete(userId);
  user.status = 'lobby';

  user.ws.send(JSON.stringify({
    type: 'QUEUE_CANCELLED'
  }));

  broadcast({
    type: 'QUEUE_UPDATED',
    queueSize: waitingQueue.size
  });
}

function handleSelectGame(userId, message) {
  const user = users.get(userId);
  if (!user || !user.pairId) return;

  const pair = pairs.get(user.pairId);
  if (!pair) return;

  const game = message.game;
  if (!GAMES.includes(game)) return;

  pair.selectedGame = game;

  // Notify partner
  const partnerId = pair.user1Id === userId ? pair.user2Id : pair.user1Id;
  const partner = users.get(partnerId);
  if (partner) {
    partner.ws.send(JSON.stringify({
      type: 'GAME_SELECTED',
      game
    }));
  }
}

function handleStartGame(userId, message) {
   const user = users.get(userId);
   if (!user || !user.pairId) return;

   const pair = pairs.get(user.pairId);
   if (!pair) return;

   pair.status = 'in_game';
   pair.gameId = uuidv4();

   const partner1 = users.get(pair.user1Id);
   const partner2 = users.get(pair.user2Id);

   if (partner1) {
     partner1.ws.send(JSON.stringify({
       type: 'GAME_STARTED',
       gameId: pair.gameId,
       game: pair.selectedGame,
       isPlayer1: true
     }));
   }

   if (partner2) {
     partner2.ws.send(JSON.stringify({
       type: 'GAME_STARTED',
       gameId: pair.gameId,
       game: pair.selectedGame,
       isPlayer1: false
     }));
   }
 }

function handleICECandidate(userId, message) {
  const user = users.get(userId);
  if (!user || !user.pairId) return;

  const pair = pairs.get(user.pairId);
  if (!pair) return;

  const partnerId = pair.user1Id === userId ? pair.user2Id : pair.user1Id;
  const partner = users.get(partnerId);

  if (partner) {
    partner.ws.send(JSON.stringify({
      type: 'ICE_CANDIDATE',
      candidate: message.candidate,
      from: userId
    }));
  }
}

function handleOffer(userId, message) {
  const user = users.get(userId);
  if (!user || !user.pairId) return;

  const pair = pairs.get(user.pairId);
  if (!pair) return;

  const partnerId = pair.user1Id === userId ? pair.user2Id : pair.user1Id;
  const partner = users.get(partnerId);

  if (partner) {
    partner.ws.send(JSON.stringify({
      type: 'OFFER',
      offer: message.offer,
      from: userId
    }));
  }
}

function handleAnswer(userId, message) {
  const user = users.get(userId);
  if (!user || !user.pairId) return;

  const pair = pairs.get(user.pairId);
  if (!pair) return;

  const partnerId = pair.user1Id === userId ? pair.user2Id : pair.user1Id;
  const partner = users.get(partnerId);

  if (partner) {
    partner.ws.send(JSON.stringify({
      type: 'ANSWER',
      answer: message.answer,
      from: userId
    }));
  }
}

function handleLeavePair(userId) {
  const user = users.get(userId);
  if (!user || !user.pairId) return;

  const pair = pairs.get(user.pairId);
  if (!pair) return;

  const partnerId = pair.user1Id === userId ? pair.user2Id : pair.user1Id;
  const partner = users.get(partnerId);

  if (partner) {
    partner.ws.send(JSON.stringify({
      type: 'PARTNER_LEFT'
    }));
  }

  pairs.delete(user.pairId);
  user.pairId = null;
  user.status = 'lobby';
}

function handleGameMove(userId, message) {
  const user = users.get(userId);
  if (!user || !user.pairId) return;

  const pair = pairs.get(user.pairId);
  if (!pair) return;

  const partnerId = pair.user1Id === userId ? pair.user2Id : pair.user1Id;
  const partner = users.get(partnerId);

  if (partner) {
    partner.ws.send(JSON.stringify({
      type: 'GAME_MOVE',
      move: message.move
    }));
  }
}

function handleUserDisconnect(userId) {
  const user = users.get(userId);
  if (!user) return;

  if (user.pairId) {
    handleLeavePair(userId);
  }

  waitingQueue.delete(userId);
  users.delete(userId);

  broadcast({
    type: 'USER_COUNT',
    count: users.size,
    queueSize: waitingQueue.size
  });
}

function broadcast(message) {
  const data = JSON.stringify(message);
  users.forEach((user) => {
    if (user.ws.readyState === 1) { // WebSocket.OPEN
      user.ws.send(data);
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
