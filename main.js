// Global state
let ws = null;
let userId = null;
let currentScreen = 'lobby';
let pairId = null;
let partnerId = null;
let peerConnection = null;
let localStream = null;
let remoteStream = null;
let selectedGame = null;
let gameId = null;
let microphoneEnabled = false;
let speakerEnabled = true;
let currentGame = null;
let isPlayer1 = true;
let userHasInteracted = false; // Track if user has clicked/touched (needed for audio autoplay on production)

const SIGNALING_SERVER = window.location.hostname === 'localhost' 
  ? `ws://${window.location.host}` 
  : (window.location.protocol === 'https:' 
      ? `wss://kazzywazzy.onrender.com` 
      : `ws://kazzywazzy.onrender.com:10000`);

// Base URL for REST API calls (same server as WebSocket)
const API_BASE = window.location.hostname === 'localhost'
  ? ''  // same origin on localhost
  : 'https://kazzywazzy.onrender.com';

console.log('Environment:', {
  hostname: window.location.hostname,
  protocol: window.location.protocol,
  SIGNALING_SERVER,
  API_BASE
});

// Screen management
function switchScreen(screenName) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(`${screenName}-screen`).classList.add('active');
  currentScreen = screenName;
}

// Initialize WebSocket connection
function initWebSocket() {
  ws = new WebSocket(SIGNALING_SERVER);

  ws.onopen = () => {
    console.log('Connected to server');
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleServerMessage(message);
  };

  ws.onclose = () => {
    console.log('Disconnected from server');
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

function sendMessage(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function handleServerMessage(message) {
  switch (message.type) {
    case 'JOINED_LOBBY':
      handleJoinedLobby(message);
      break;
    case 'USER_COUNT':
      updateUserCount(message);
      break;
    case 'QUEUED':
      handleQueued(message);
      break;
    case 'QUEUE_UPDATED':
      updateQueueCount(message);
      break;
    case 'PAIRED':
      handlePaired(message);
      break;
    case 'GAME_SELECTED':
      handleGameSelected(message);
      break;
    case 'GAME_STARTED':
      handleGameStarted(message);
      break;
    case 'OFFER':
      handleOffer(message);
      break;
    case 'ANSWER':
      handleAnswer(message);
      break;
    case 'ICE_CANDIDATE':
      handleICECandidate(message);
      break;
    case 'GAME_MOVE':
      handleGameMove(message);
      break;
    case 'PARTNER_LEFT':
      handlePartnerLeft(message);
      break;
  }
}

function handleJoinedLobby(message) {
  userId = message.userId;
  switchScreen('lobby');
}

function updateUserCount(message) {
  document.getElementById('user-count').textContent = message.count;
  if (message.queueSize !== undefined) {
    updateQueueCount(message);
  }
}

function updateQueueCount(message) {
  document.getElementById('queue-count').textContent = message.queueSize;
}

function handleQueued(message) {
  switchScreen('queue');
  document.getElementById('queue-position').textContent = message.queuePosition;
}

function handlePaired(message) {
  pairId = message.pairId;
  partnerId = message.partnerId;
  document.getElementById('partner-name').textContent = message.partnerUsername;
  
  // Populate game list
  const gameList = document.getElementById('game-list');
  gameList.innerHTML = '';
  message.games.forEach(game => {
    const gameItem = document.createElement('div');
    gameItem.className = 'game-item';
    gameItem.innerHTML = `<p>${game}</p>`;
    gameItem.onclick = () => selectGame(game, gameItem);
    gameList.appendChild(gameItem);
  });

  switchScreen('game-selection');
}

function selectGame(game, element) {
  // Remove previous selection
  document.querySelectorAll('.game-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  // Mark selected
  element.classList.add('selected');
  selectedGame = game;
  
  // Enable start button
  document.getElementById('start-game-btn').disabled = false;
  
  // Send selection to partner
  sendMessage({
    type: 'SELECT_GAME',
    game
  });
}

function handleGameSelected(message) {
  const gameList = document.getElementById('game-list');
  const items = gameList.querySelectorAll('.game-item');
  items.forEach((item) => {
    if (item.textContent.includes(message.game)) {
      item.classList.add('selected');
    }
  });
}

function handleGameStarted(message) {
   gameId = message.gameId;
   selectedGame = message.game;
   isPlayer1 = message.isPlayer1 === true;
   document.getElementById('current-game').textContent = message.game;
   document.getElementById('game-partner-name').textContent = 
     document.getElementById('partner-name').textContent;
   
   switchScreen('game');
   initializeGame(message.game);
   
   // Only the caller (player1) initiates voice chat.
   // The answerer (player2) waits for the offer to arrive via handleOffer().
   if (isPlayer1) {
     initializeVoiceChat();
   }
 }

function initializeGame(game) {
   const gameArea = document.getElementById('game-area');
   gameArea.innerHTML = ''; // Clear previous content
   
   const onGameMove = (moveData) => {
     sendMessage({
       type: 'GAME_MOVE',
       move: moveData
     });
   };
   
   const onGameEnd = (result) => {
     setTimeout(() => {
       const resultText = result === 'win' ? '✓ You Won! 🎉' : result === 'loss' ? '✗ You Lost 😢' : '= Draw 🤝';
       alert(`Game Over!\n${resultText}`);
       cleanup();
       switchScreen('lobby');
     }, 500);
   };
   
   switch(game) {
     case 'Tic Tac Toe':
       currentGame = new TicTacToe(gameArea, onGameMove, onGameEnd, isPlayer1);
       break;
     case 'Connect Four':
       currentGame = new ConnectFour(gameArea, onGameMove, onGameEnd, isPlayer1);
       break;
     case 'Trivia':
       currentGame = new Trivia(gameArea, onGameMove, onGameEnd, isPlayer1);
       break;
     case 'Word Battle':
       currentGame = new WordBattle(gameArea, onGameMove, onGameEnd, isPlayer1);
       break;
     case 'Rock Paper Scissors':
       currentGame = new RockPaperScissors(gameArea, onGameMove, onGameEnd, isPlayer1);
       break;
     case 'Number Guessing':
       currentGame = new SimpleGuessing(gameArea, onGameMove, onGameEnd, isPlayer1);
       break;
     default:
       gameArea.innerHTML = '<p>Game not implemented yet</p>';
   }
 }

function handleGameMove(message) {
   if (!currentGame) return;
   
   const move = message.move;
   
   if (selectedGame === 'Tic Tac Toe' || selectedGame === 'Connect Four') {
     if (currentGame.receivedMove) {
       currentGame.receivedMove(move);
     }
   } else if (selectedGame === 'Trivia' || selectedGame === 'Word Battle') {
     if (currentGame.receivedAnswer) {
       currentGame.receivedAnswer(move);
     }
   } else if (selectedGame === 'Rock Paper Scissors') {
     if (currentGame.receivedMove) {
       currentGame.receivedMove(move);
     }
   } else if (selectedGame === 'Number Guessing') {
     if (currentGame.receivedGuess) {
       currentGame.receivedGuess(move);
     }
   }
 }

// ============================================================
// VOICE CHAT - FIXED IMPLEMENTATION
// ============================================================

// Voice chat state
let voiceState = {
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  isCaller: false,
  iceCandidateBuffer: [],  // Buffer ICE candidates that arrive before PC is ready
  audioLevelInterval: null
};

// Cached ICE server config — fetched once from the backend
let cachedICEConfig = null;

/**
 * Fetch ICE server configuration (STUN + TURN) from the backend.
 * TURN credentials are stored as env vars on the server for security.
 */
async function fetchICEServers() {
  if (cachedICEConfig) return cachedICEConfig;

  try {
    const response = await fetch(`${API_BASE}/api/ice-servers`);
    const data = await response.json();
    cachedICEConfig = {
      iceServers: data.iceServers,
      iceCandidatePoolSize: 2
    };
    const hasTurn = data.iceServers.some(s => {
      const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
      return urls.some(u => u.startsWith('turn:') || u.startsWith('turns:'));
    });
    console.log(`✅ ICE config fetched: ${data.iceServers.length} servers, TURN: ${hasTurn ? 'YES' : 'NO (cross-network may fail)'}`);
    return cachedICEConfig;
  } catch (error) {
    console.warn('⚠️ Failed to fetch ICE servers, using STUN-only fallback:', error.message);
    cachedICEConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      iceCandidatePoolSize: 2
    };
    return cachedICEConfig;
  }
}

/**
 * Called ONLY by the caller (isPlayer1).
 * The answerer (isPlayer2) does NOT call this — they wait for
 * the OFFER message to arrive via handleOffer().
 */
async function initializeVoiceChat() {
  console.log('🎤 VOICE CHAT [CALLER]: Starting initialization...');
  
  try {
    // Step 1: Get microphone
    voiceState.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    });
    console.log('✅ VOICE CHAT [CALLER]: Microphone access granted');
    updateLocalIndicator(true);
    
    // Step 2: Create peer connection with dynamically fetched ICE config
    const rtcConfig = await fetchICEServers();
    voiceState.peerConnection = new RTCPeerConnection(rtcConfig);
    voiceState.isCaller = true;
    
    // Step 3: Add local tracks BEFORE creating offer
    voiceState.localStream.getAudioTracks().forEach(track => {
      voiceState.peerConnection.addTrack(track, voiceState.localStream);
    });
    
    // Step 4: Setup event handlers
    setupVoiceChatHandlers();
    
    // Step 5: Create and send offer
    const offer = await voiceState.peerConnection.createOffer();
    await voiceState.peerConnection.setLocalDescription(offer);
    console.log('📤 VOICE CHAT [CALLER]: Offer created, sending to partner...');
    
    sendMessage({
      type: 'OFFER',
      offer: voiceState.peerConnection.localDescription
    });
    
    // Flush any ICE candidates that arrived early
    flushICECandidateBuffer();
    
    startAudioLevelMonitor();
    console.log('✅ VOICE CHAT [CALLER]: Initialization complete');
    
  } catch (error) {
    console.error('❌ VOICE CHAT [CALLER]: Initialization failed:', error);
  }
}

function setupVoiceChatHandlers() {
  const pc = voiceState.peerConnection;
  
  // When we receive a remote audio track
  pc.ontrack = (event) => {
    console.log('🎵 VOICE CHAT: Received remote audio track:', event.track.kind);
    
    if (event.streams && event.streams.length > 0) {
      voiceState.remoteStream = event.streams[0];
    } else {
      // Fallback: create a new stream from the track
      if (!voiceState.remoteStream) {
        voiceState.remoteStream = new MediaStream();
      }
      voiceState.remoteStream.addTrack(event.track);
    }
    playRemoteAudio();
    updateRemoteIndicator(true);
  };
  
  // Connection state changes
  pc.onconnectionstatechange = () => {
    const state = pc.connectionState;
    console.log('📡 VOICE CHAT: Connection state:', state);
    
    if (state === 'connected') {
      console.log('✅ VOICE CHAT: Peer connection established!');
      updateRemoteIndicator(true);
    } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
      console.error('❌ VOICE CHAT: Connection lost:', state);
      updateRemoteIndicator(false);
    }
  };
  
  pc.oniceconnectionstatechange = () => {
    console.log('🧊 VOICE CHAT: ICE state:', pc.iceConnectionState);
  };
  
  // Send ICE candidates to the remote peer
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendMessage({
        type: 'ICE_CANDIDATE',
        candidate: event.candidate
      });
    }
  };
}

function playRemoteAudio() {
  const remoteAudio = document.getElementById('remote-audio');
  if (!remoteAudio) {
    console.error('❌ VOICE CHAT: Remote audio element not found in DOM');
    return;
  }
  
  remoteAudio.srcObject = voiceState.remoteStream;
  remoteAudio.muted = false;
  remoteAudio.volume = 1.0;
  
  const playPromise = remoteAudio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log('✅ VOICE CHAT: Remote audio is playing');
      })
      .catch(err => {
        console.warn('⚠️ VOICE CHAT: Autoplay blocked:', err.message);
        // Browser blocked autoplay — retry on next user click
        const retryPlay = () => {
          remoteAudio.play()
            .then(() => console.log('✅ VOICE CHAT: Audio resumed after user interaction'))
            .catch(e => console.error('Retry play failed:', e));
        };
        document.addEventListener('click', retryPlay, { once: true });
        document.addEventListener('touchstart', retryPlay, { once: true });
      });
  }
}

/**
 * Called ONLY by the answerer (isPlayer2) when the OFFER message arrives.
 */
async function handleOffer(message) {
  console.log('📬 VOICE CHAT [ANSWERER]: Received offer');
  
  try {
    // Step 1: Get microphone (answerer didn't call initializeVoiceChat)
    if (!voiceState.localStream) {
      voiceState.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      console.log('✅ VOICE CHAT [ANSWERER]: Microphone access granted');
      updateLocalIndicator(true);
    }
    
    // Step 2: Create peer connection (only if not already created)
    if (!voiceState.peerConnection) {
      const rtcConfig = await fetchICEServers();
      voiceState.peerConnection = new RTCPeerConnection(rtcConfig);
      voiceState.isCaller = false;
      
      // Add local tracks
      voiceState.localStream.getAudioTracks().forEach(track => {
        voiceState.peerConnection.addTrack(track, voiceState.localStream);
      });
      
      setupVoiceChatHandlers();
    }
    
    // Step 3: Set remote description (the offer)
    await voiceState.peerConnection.setRemoteDescription(
      new RTCSessionDescription(message.offer)
    );
    console.log('✅ VOICE CHAT [ANSWERER]: Remote description set');
    
    // Step 4: Flush any buffered ICE candidates now that remoteDescription is set
    flushICECandidateBuffer();
    
    // Step 5: Create and send answer
    const answer = await voiceState.peerConnection.createAnswer();
    await voiceState.peerConnection.setLocalDescription(answer);
    console.log('📤 VOICE CHAT [ANSWERER]: Answer created, sending...');
    
    sendMessage({
      type: 'ANSWER',
      answer: voiceState.peerConnection.localDescription
    });
    
    startAudioLevelMonitor();
    console.log('✅ VOICE CHAT [ANSWERER]: Initialization complete');
    
  } catch (error) {
    console.error('❌ VOICE CHAT [ANSWERER]: Error handling offer:', error);
  }
}

/**
 * Called by the caller (isPlayer1) when the ANSWER message arrives.
 */
async function handleAnswer(message) {
  console.log('📬 VOICE CHAT [CALLER]: Received answer');
  
  try {
    if (!voiceState.peerConnection) {
      console.error('❌ VOICE CHAT [CALLER]: No peer connection when answer arrived');
      return;
    }
    
    await voiceState.peerConnection.setRemoteDescription(
      new RTCSessionDescription(message.answer)
    );
    console.log('✅ VOICE CHAT [CALLER]: Remote description set, connection establishing...');
    
    // Flush any buffered ICE candidates now that remoteDescription is set
    flushICECandidateBuffer();
    
  } catch (error) {
    console.error('❌ VOICE CHAT [CALLER]: Error handling answer:', error);
  }
}

/**
 * Buffer ICE candidates if peer connection isn't ready yet,
 * otherwise add them directly.
 */
async function handleICECandidate(message) {
  try {
    // If no peer connection or no remote description yet, buffer the candidate
    if (!voiceState.peerConnection || !voiceState.peerConnection.remoteDescription) {
      console.log('🧊 VOICE CHAT: Buffering ICE candidate (PC not ready)');
      voiceState.iceCandidateBuffer.push(message.candidate);
      return;
    }
    
    await voiceState.peerConnection.addIceCandidate(
      new RTCIceCandidate(message.candidate)
    );
    
  } catch (error) {
    // Non-fatal — some candidates just don't work
    console.warn('⚠️ VOICE CHAT: ICE candidate error:', error.message);
  }
}

/**
 * Flush buffered ICE candidates once the peer connection and
 * remote description are both ready.
 */
async function flushICECandidateBuffer() {
  if (!voiceState.peerConnection || !voiceState.peerConnection.remoteDescription) return;
  
  const buffered = voiceState.iceCandidateBuffer.splice(0);
  if (buffered.length > 0) {
    console.log(`🧊 VOICE CHAT: Flushing ${buffered.length} buffered ICE candidates`);
  }
  for (const candidate of buffered) {
    try {
      await voiceState.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('⚠️ VOICE CHAT: Buffered ICE candidate error:', e.message);
    }
  }
}

/**
 * Visual indicator helpers
 */
function updateLocalIndicator(active) {
  const el = document.getElementById('local-audio-indicator');
  if (el) el.classList.toggle('active', active);
}

function updateRemoteIndicator(active) {
  const el = document.getElementById('remote-audio-indicator');
  if (el) el.classList.toggle('active', active);
}

/**
 * Periodically check audio levels so the indicators pulse.
 */
function startAudioLevelMonitor() {
  // Clear any previous monitor
  if (voiceState.audioLevelInterval) {
    clearInterval(voiceState.audioLevelInterval);
  }
  
  voiceState.audioLevelInterval = setInterval(() => {
    // Update local indicator based on whether mic track is enabled
    if (voiceState.localStream) {
      const tracks = voiceState.localStream.getAudioTracks();
      const anyEnabled = tracks.some(t => t.enabled && t.readyState === 'live');
      updateLocalIndicator(anyEnabled);
    } else {
      updateLocalIndicator(false);
    }
    
    // Update remote indicator based on connection state
    if (voiceState.peerConnection) {
      const connected = voiceState.peerConnection.connectionState === 'connected';
      updateRemoteIndicator(connected && voiceState.remoteStream !== null);
    } else {
      updateRemoteIndicator(false);
    }
  }, 1000);
}

function cleanupVoiceChat() {
  console.log('🧹 VOICE CHAT: Cleaning up...');
  
  if (voiceState.audioLevelInterval) {
    clearInterval(voiceState.audioLevelInterval);
    voiceState.audioLevelInterval = null;
  }
  
  if (voiceState.localStream) {
    voiceState.localStream.getTracks().forEach(track => track.stop());
    voiceState.localStream = null;
  }
  
  if (voiceState.peerConnection) {
    voiceState.peerConnection.close();
    voiceState.peerConnection = null;
  }
  
  voiceState.remoteStream = null;
  voiceState.iceCandidateBuffer = [];
  
  const remoteAudio = document.getElementById('remote-audio');
  if (remoteAudio) {
    remoteAudio.srcObject = null;
  }
  
  updateLocalIndicator(false);
  updateRemoteIndicator(false);
  
  console.log('✅ VOICE CHAT: Cleaned up');
}

function handlePartnerLeft() {
  alert('Your partner has left the game.');
  cleanup();
  switchScreen('lobby');
}

// Event listeners
document.getElementById('join-btn').addEventListener('click', () => {
  const username = document.getElementById('username-input').value || 'Anonymous';
  sendMessage({
    type: 'JOIN_LOBBY',
    username
  });
});

document.getElementById('username-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('join-btn').click();
  }
});

document.getElementById('queue-btn').addEventListener('click', () => {
  sendMessage({ type: 'QUEUE_FOR_MATCH' });
  switchScreen('queue');
});

document.getElementById('cancel-queue-btn').addEventListener('click', () => {
  sendMessage({ type: 'CANCEL_QUEUE' });
  switchScreen('lobby');
});

document.getElementById('start-game-btn').addEventListener('click', () => {
  if (selectedGame) {
    sendMessage({
      type: 'START_GAME',
      game: selectedGame
    });
  }
});

document.getElementById('toggle-microphone').addEventListener('click', (e) => {
  if (voiceState.localStream) {
    const audioTracks = voiceState.localStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
      microphoneEnabled = track.enabled;
    });
    
    e.target.classList.toggle('active', microphoneEnabled);
    e.target.textContent = microphoneEnabled ? '🎤 Microphone On' : '🎤 Microphone Off';
  }
});

document.getElementById('toggle-speaker').addEventListener('click', (e) => {
  const remoteAudio = document.getElementById('remote-audio');
  remoteAudio.muted = !remoteAudio.muted;
  speakerEnabled = !remoteAudio.muted;
  
  e.target.classList.toggle('active', speakerEnabled);
  e.target.textContent = speakerEnabled ? '🔊 Speaker On' : '🔊 Speaker Off';
});

document.getElementById('leave-game-btn').addEventListener('click', () => {
  sendMessage({ type: 'LEAVE_PAIR' });
  cleanup();
  switchScreen('lobby');
});

function cleanup() {
  cleanupVoiceChat();
  
  pairId = null;
  partnerId = null;
  gameId = null;
  selectedGame = null;
  currentGame = null;
  microphoneEnabled = false;
  speakerEnabled = true;
}

// Initialize
document.addEventListener('click', () => {
  userHasInteracted = true;
  console.log('User interaction detected - audio autoplay should now be allowed');
});

document.addEventListener('touchstart', () => {
  userHasInteracted = true;
  console.log('User touch detected - audio autoplay should now be allowed');
});

initWebSocket();
