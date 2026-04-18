# Team Game Pairing Web App

A web application that randomly pairs users together to play two-player team games with voice chat.

## Features

- **Random Pairing**: Automatically matches users together based on queue
- **Voice Chat**: Real-time WebRTC peer-to-peer voice communication
- **Game Selection**: Choose from multiple games to play with your partner
- **Audio Indicators**: Visual feedback showing who is speaking
- **Real-time Updates**: WebSocket-based messaging for instant updates

## Available Games

- Chess
- Connect Four
- Tic Tac Toe
- Word Battle
- Trivia
- Quick Draw

## Tech Stack

- **Backend**: Node.js, Express, WebSocket (ws)
- **Frontend**: Vanilla JavaScript, WebRTC, HTML5
- **Build Tool**: Vite
- **Communication**: WebSocket for signaling, WebRTC for peer connection

## Setup & Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The server will run on `http://localhost:3000`

### Development with Nodemon

For auto-restart on file changes:
```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## How It Works

### Flow

1. **Join Lobby**: Users enter a username and join the lobby
2. **Queue for Match**: Click "Find Partner" to enter the matching queue
3. **Auto-pairing**: When 2 or more users are in queue, they are automatically paired
4. **Game Selection**: Both users select a game to play
5. **Voice Chat**: WebRTC establishes a peer-to-peer voice connection
6. **Play Game**: Users can now communicate and play the selected game

### Backend Architecture

- **User Management**: Tracks online users and their status
- **Queue System**: FIFO queue for matching users
- **Pairing Logic**: Pairs first two users in queue when threshold is reached
- **Signaling**: WebSocket handles WebRTC offer/answer/ICE candidates
- **Broadcasting**: Updates user count and queue status to all clients

### Frontend Architecture

- **Screen Management**: Different screens for lobby, queue, game selection, and gameplay
- **WebRTC Connection**: Establishes peer connection with offer/answer flow
- **Audio Monitoring**: Displays active speaker indicators
- **State Management**: Tracks user, pair, game, and stream states

## API Messages

### Client to Server

- `JOIN_LOBBY`: Join the lobby with username
- `QUEUE_FOR_MATCH`: Enter the matching queue
- `CANCEL_QUEUE`: Leave the queue
- `SELECT_GAME`: Choose a game to play
- `START_GAME`: Begin the game
- `OFFER`: WebRTC offer for voice connection
- `ANSWER`: WebRTC answer for voice connection
- `ICE_CANDIDATE`: ICE candidate for connection
- `LEAVE_PAIR`: Leave the current pair/game

### Server to Client

- `JOINED_LOBBY`: Confirms lobby join with userId
- `QUEUED`: Acknowledges queue entry
- `QUEUE_UPDATED`: Updates queue size
- `USER_COUNT`: Broadcasting user count
- `PAIRED`: Notifies of successful pairing
- `GAME_SELECTED`: Partner selected a game
- `GAME_STARTED`: Game has started
- `OFFER/ANSWER/ICE_CANDIDATE`: WebRTC signaling
- `PARTNER_LEFT`: Partner disconnected

## Features to Add

- [ ] Persistent game scores
- [ ] Player ratings/rankings
- [ ] Different game implementations (Chess, Tic Tac Toe, etc.)
- [ ] User profiles
- [ ] Chat messaging
- [ ] Spectator mode
- [ ] Replay functionality
- [ ] Video chat option
- [ ] Game lobby/room creation
- [ ] Mobile optimization

## Troubleshooting

### Microphone not working
- Check browser permissions for microphone access
- Ensure microphone is enabled in browser settings
- Check system microphone settings

### Voice chat not connecting
- Check browser console for WebRTC errors
- Ensure both users' browsers support WebRTC
- Try refreshing the page
- Check firewall settings

### Getting paired with same user repeatedly
- This is random - more users in the queue increases variety

## Browser Support

- Chrome/Edge (v60+)
- Firefox (v55+)
- Safari (v11+)

Requires WebRTC and Web Audio API support.

## Development Notes

- STUN servers are used for NAT traversal (Google's public STUN servers)
- Audio-only for now, but video can be easily added
- Supports multiple concurrent pairs on same server
- Scales horizontally with multiple servers and signaling proxy

## License

MIT
