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

const SIGNALING_SERVER = `ws://${window.location.host}`;

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
  items.forEach((item, index) => {
    if (item.textContent.includes(message.game)) {
      item.classList.add('selected');
    }
  });
}

function handleGameStarted(message) {
  gameId = message.gameId;
  selectedGame = message.game;
  document.getElementById('current-game').textContent = message.game;
  document.getElementById('game-partner-name').textContent = 
    document.getElementById('partner-name').textContent;
  
  switchScreen('game');
  initializeVoiceChat();
}

async function initializeVoiceChat() {
  try {
    // Get local media
    localStream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: false 
    });
    
    // Initialize WebRTC peer connection
    const configuration = {
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] }
      ]
    };
    
    peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream to peer connection
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
    
    // Handle remote stream
    peerConnection.ontrack = (event) => {
      remoteStream = event.streams[0];
      const remoteAudio = document.getElementById('remote-audio');
      remoteAudio.srcObject = remoteStream;
      updateRemoteAudioIndicator();
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'ICE_CANDIDATE',
          candidate: event.candidate
        });
      }
    };
    
    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    sendMessage({
      type: 'OFFER',
      offer: offer
    });
    
    // Monitor local audio
    monitorLocalAudio();
    
  } catch (error) {
    console.error('Error initializing voice chat:', error);
    alert('Failed to access microphone. Please check permissions.');
  }
}

async function handleOffer(message) {
  try {
    if (!peerConnection) {
      const configuration = {
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302'] },
          { urls: ['stun:stun1.l.google.com:19302'] }
        ]
      };
      
      peerConnection = new RTCPeerConnection(configuration);
      
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      
      peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        const remoteAudio = document.getElementById('remote-audio');
        remoteAudio.srcObject = remoteStream;
        updateRemoteAudioIndicator();
      };
      
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendMessage({
            type: 'ICE_CANDIDATE',
            candidate: event.candidate
          });
        }
      };
    }
    
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(message.offer)
    );
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    sendMessage({
      type: 'ANSWER',
      answer: answer
    });
  } catch (error) {
    console.error('Error handling offer:', error);
  }
}

async function handleAnswer(message) {
  try {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(message.answer)
    );
  } catch (error) {
    console.error('Error handling answer:', error);
  }
}

async function handleICECandidate(message) {
  try {
    await peerConnection.addIceCandidate(
      new RTCIceCandidate(message.candidate)
    );
  } catch (error) {
    console.error('Error handling ICE candidate:', error);
  }
}

function monitorLocalAudio() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const microphone = audioContext.createMediaStreamSource(localStream);
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  
  microphone.connect(analyser);
  analyser.smoothingTimeConstant = 0.8;
  analyser.fftSize = 1024;
  
  const indicator = document.getElementById('local-audio-indicator');
  
  function check() {
    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    
    if (average > 30) {
      indicator.classList.add('active');
    } else {
      indicator.classList.remove('active');
    }
    
    requestAnimationFrame(check);
  }
  
  check();
}

function updateRemoteAudioIndicator() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const microphone = audioContext.createMediaStreamSource(remoteStream);
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  
  microphone.connect(analyser);
  analyser.smoothingTimeConstant = 0.8;
  analyser.fftSize = 1024;
  
  const indicator = document.getElementById('remote-audio-indicator');
  
  function check() {
    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    
    if (average > 30) {
      indicator.classList.add('active');
    } else {
      indicator.classList.remove('active');
    }
    
    requestAnimationFrame(check);
  }
  
  check();
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
  if (localStream) {
    const audioTracks = localStream.getAudioTracks();
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
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  if (remoteStream) {
    remoteStream.getTracks().forEach(track => track.stop());
    remoteStream = null;
  }
  
  document.getElementById('remote-audio').srcObject = null;
  pairId = null;
  partnerId = null;
  gameId = null;
  selectedGame = null;
}

// Initialize
initWebSocket();
