# Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will be available at `http://localhost:3000`

### 3. Open in Browser
Open multiple browser tabs/windows at `http://localhost:3000` to test the pairing feature.

## 🎮 How to Use

### Step 1: Join Lobby
- Enter a username and click "Join Lobby"
- You'll see the current number of users online

### Step 2: Find a Partner
- Click the button to queue for a match
- Wait for another user to join the queue
- When 2+ users are queued, they are automatically paired

### Step 3: Select a Game
- After pairing, both users see a list of available games
- Click on a game to select it
- Your selection is sent to your partner

### Step 4: Start Playing
- Click "Start Game" when both users are ready
- Voice chat will automatically initialize
- You'll see audio indicators showing who's speaking

### Step 5: Voice Chat Controls
- **Enable Microphone**: Toggle your microphone on/off
- **Speaker**: Toggle receiving audio on/off
- **Audio Indicators**: Green pulsing circle shows active speaker

## 🧪 Testing with Multiple Users

### Local Testing (Single Machine)
1. Open `http://localhost:3000` in Tab 1
2. Open `http://localhost:3000` in Tab 2
3. Open `http://localhost:3000` in Tab 3
4. Enter different usernames in each tab
5. Queue two users and watch them pair automatically

### Multi-Machine Testing
1. Get your local IP: 
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig`
2. On other machines, visit `http://YOUR_IP:3000`

## 🔧 Development

### Auto-reload on Changes
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## 📱 Testing Microphone Access

The first time you run the app, you'll be prompted to allow microphone access:
1. Click "Allow" when the browser asks for microphone permission
2. If denied, go to browser settings and enable microphone for localhost

## 🐛 Troubleshooting

### Microphone Not Working
- Check browser console (F12) for errors
- Ensure microphone is plugged in and not muted
- Check browser microphone permissions
- Try a different browser

### Users Not Pairing
- Ensure both tabs are in the queue
- Reload the page and try again
- Check browser console for WebSocket errors

### Voice Chat Not Connecting
- Wait 5-10 seconds for WebRTC to establish
- Check browser console for connection errors
- Both users need to be on the same network (for local testing)
- Try refreshing the page

### Port Already in Use
If port 3000 is already in use, you can change it:
```bash
PORT=3001 npm start
```

## 📊 Project Structure

```
.
├── server/
│   └── index.js           # Node.js/Express server with WebSocket
├── index.html             # Frontend HTML
├── main.js                # Frontend JavaScript (WebRTC logic)
├── style.css              # Frontend styling
├── package.json           # Dependencies
├── .env                   # Environment variables
└── dist/                  # Production build output
```

## 🎯 Next Steps

### Features to Add
1. Implement actual game logic (Chess, Tic Tac Toe, etc.)
2. Add video chat option
3. Player ratings/rankings
4. Chat messaging during gameplay
5. Game replay functionality
6. Persistent scores database

### Deployment
- Deploy to Heroku, Render, or AWS
- Use a TURN server for better NAT traversal
- Add HTTPS/WSS for production

## 💡 Tips

- Keep browser tabs side-by-side for easier testing
- Use different usernames for clarity
- Check browser console (F12) for debugging
- Test with microphone unplugged first to verify connection
- Monitor network tab to see WebSocket messages

## 🆘 Need Help?

- Check the browser console for error messages (F12)
- Ensure Node.js is installed (`node --version`)
- Try clearing browser cache and refreshing
- Restart the server

Enjoy! 🎮🎤
