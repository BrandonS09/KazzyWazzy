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

console.log('Environment:', {
  hostname: window.location.hostname,
  protocol: window.location.protocol,
  SIGNALING_SERVER
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
   initializeVoiceChat();
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
// VOICE CHAT - COMPLETE REIMPLEMENTATION
// ============================================================

// Voice chat state
let voiceState = {
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  isCaller: false
};

const STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:global.stun.twilio.com:3478'
];

const RTCConfig = {
  iceServers: [
    ...STUN_SERVERS.map(url => ({ urls: url })),
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

async function initializeVoiceChat() {
  console.log('🎤 VOICE CHAT: Starting initialization...');
  
  try {
    // Step 1: Get microphone
    console.log('🎤 VOICE CHAT: Requesting microphone access...');
    voiceState.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    });
    console.log('✅ VOICE CHAT: Microphone access granted');
    
    // Step 2: Create peer connection
    console.log('🔌 VOICE CHAT: Creating RTCPeerConnection...');
    voiceState.peerConnection = new RTCPeerConnection(RTCConfig);
    voiceState.isCaller = true;
    
    // Step 3: Add local tracks
    console.log('📍 VOICE CHAT: Adding local audio tracks...');
    voiceState.localStream.getAudioTracks().forEach(track => {
      voiceState.peerConnection.addTrack(track, voiceState.localStream);
    });
    console.log('✅ VOICE CHAT: Local tracks added');
    
    // Step 4: Setup event handlers
    setupVoiceChatHandlers();
    
    // Step 5: Create and send offer
    console.log('📤 VOICE CHAT: Creating offer...');
    const offer = await voiceState.peerConnection.createOffer();
    await voiceState.peerConnection.setLocalDescription(offer);
    console.log('✅ VOICE CHAT: Offer created, sending to partner...');
    
    sendMessage({
      type: 'OFFER',
      offer: offer
    });
    
    console.log('✅ VOICE CHAT: Initialization complete');
    
  } catch (error) {
    console.error('❌ VOICE CHAT: Initialization failed:', error);
    alert('Microphone access denied. Please check permissions.');
  }
}

function setupVoiceChatHandlers() {
  console.log('⚙️ VOICE CHAT: Setting up event handlers...');
  
  const pc = voiceState.peerConnection;
  
  // When we receive a remote audio track
  pc.ontrack = (event) => {
    console.log('🎵 VOICE CHAT: Received remote audio track');
    console.log('   Track:', event.track.kind, 'ID:', event.track.id);
    console.log('   Streams:', event.streams.length);
    
    if (event.streams && event.streams.length > 0) {
      voiceState.remoteStream = event.streams[0];
      playRemoteAudio();
    }
  };
  
  // Connection state changes
  pc.onconnectionstatechange = () => {
    const state = pc.connectionState;
    console.log('📡 VOICE CHAT: Connection state:', state);
    
    if (state === 'failed' || state === 'disconnected' || state === 'closed') {
      console.error('❌ VOICE CHAT: Connection lost');
    }
  };
  
  pc.oniceconnectionstatechange = () => {
    console.log('🧊 VOICE CHAT: ICE state:', pc.iceConnectionState);
  };
  
  // Send ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('📤 VOICE CHAT: Sending ICE candidate');
      sendMessage({
        type: 'ICE_CANDIDATE',
        candidate: event.candidate
      });
    }
  };
}

function playRemoteAudio() {
  console.log('🔊 VOICE CHAT: Setting up remote audio playback...');
  
  const remoteAudio = document.getElementById('remote-audio');
  if (!remoteAudio) {
    console.error('❌ VOICE CHAT: Remote audio element not found');
    return;
  }
  
  remoteAudio.srcObject = voiceState.remoteStream;
  remoteAudio.muted = false;
  
  // Try to play
  remoteAudio.play()
    .then(() => {
      console.log('✅ VOICE CHAT: Remote audio is playing');
    })
    .catch(err => {
      console.error('❌ VOICE CHAT: Could not play remote audio:', err.message);
      // Retry after user interaction
      document.addEventListener('click', () => {
        remoteAudio.play().catch(e => console.error('Retry failed:', e));
      }, { once: true });
    });
}

async function handleOffer(message) {
  console.log('📬 VOICE CHAT: Received offer (answerer mode)');
  
  try {
    // Step 1: Get microphone
    if (!voiceState.localStream) {
      console.log('🎤 VOICE CHAT: Answerer requesting microphone...');
      voiceState.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      console.log('✅ VOICE CHAT: Answerer microphone granted');
    }
    
    // Step 2: Create peer connection
    if (!voiceState.peerConnection) {
      console.log('🔌 VOICE CHAT: Answerer creating RTCPeerConnection...');
      voiceState.peerConnection = new RTCPeerConnection(RTCConfig);
      voiceState.isCaller = false;
      
      // Step 3: Add local tracks
      console.log('📍 VOICE CHAT: Answerer adding local audio tracks...');
      voiceState.localStream.getAudioTracks().forEach(track => {
        voiceState.peerConnection.addTrack(track, voiceState.localStream);
      });
      console.log('✅ VOICE CHAT: Answerer local tracks added');
      
      // Step 4: Setup event handlers
      setupVoiceChatHandlers();
    }
    
    // Step 5: Set remote description (the offer)
    console.log('📍 VOICE CHAT: Answerer setting remote description...');
    await voiceState.peerConnection.setRemoteDescription(
      new RTCSessionDescription(message.offer)
    );
    console.log('✅ VOICE CHAT: Remote description set');
    
    // Step 6: Create and send answer
    console.log('📤 VOICE CHAT: Answerer creating answer...');
    const answer = await voiceState.peerConnection.createAnswer();
    await voiceState.peerConnection.setLocalDescription(answer);
    console.log('✅ VOICE CHAT: Answer created, sending to caller...');
    
    sendMessage({
      type: 'ANSWER',
      answer: answer
    });
    
    console.log('✅ VOICE CHAT: Answer sent');
    
  } catch (error) {
    console.error('❌ VOICE CHAT: Error handling offer:', error);
  }
}

async function handleAnswer(message) {
  console.log('📬 VOICE CHAT: Received answer (caller)');
  
  try {
    console.log('📍 VOICE CHAT: Setting remote description with answer...');
    await voiceState.peerConnection.setRemoteDescription(
      new RTCSessionDescription(message.answer)
    );
    console.log('✅ VOICE CHAT: Answer set, connection should establish soon');
    
  } catch (error) {
    console.error('❌ VOICE CHAT: Error handling answer:', error);
  }
}

async function handleICECandidate(message) {
  try {
    if (!voiceState.peerConnection) {
      console.warn('⚠️ VOICE CHAT: Received ICE candidate but no peer connection');
      return;
    }
    
    console.log('🧊 VOICE CHAT: Adding ICE candidate');
    await voiceState.peerConnection.addIceCandidate(
      new RTCIceCandidate(message.candidate)
    );
    
  } catch (error) {
    // Ignore errors - ICE candidates can fail sometimes
    if (error.code !== 'InvalidStateError') {
      console.warn('⚠️ VOICE CHAT: ICE candidate error:', error.message);
    }
  }
}

function cleanupVoiceChat() {
  console.log('🧹 VOICE CHAT: Cleaning up...');
  
  if (voiceState.localStream) {
    voiceState.localStream.getTracks().forEach(track => track.stop());
    voiceState.localStream = null;
  }
  
  if (voiceState.peerConnection) {
    voiceState.peerConnection.close();
    voiceState.peerConnection = null;
  }
  
  voiceState.remoteStream = null;
  
  const remoteAudio = document.getElementById('remote-audio');
  if (remoteAudio) {
    remoteAudio.srcObject = null;
  }
  
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
