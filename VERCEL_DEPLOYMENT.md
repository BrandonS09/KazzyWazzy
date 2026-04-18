# Vercel Deployment Guide

## ⚠️ Important: Backend Architecture

Your application has a **Node.js backend with WebSocket** support. Vercel's standard hosting is for **static frontends only**. WebSocket connections don't work on Vercel's free tier.

**Solution:** Deploy frontend to Vercel, backend to a service that supports WebSocket.

---

## Option 1: Frontend Only on Vercel (Recommended if you host backend elsewhere)

### Step 1: Build the frontend
```bash
npm run build
```

### Step 2: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 3: Deploy to Vercel
```bash
vercel
```

Follow the prompts:
- Link to existing project or create new
- Select `dist` as the public directory
- It will auto-detect it's a Vite build

### Step 4: Set backend URL
In your `main.js`, change:
```javascript
const SIGNALING_SERVER = `ws://${window.location.host}`;
```

To:
```javascript
const SIGNALING_SERVER = `wss://your-backend-domain.com`;
```

Then redeploy to Vercel.

---

## Option 2: Full Stack on Render (Best for this app)

Render.com supports WebSocket and persistent connections. This is better for your app.

### Step 1: Push to GitHub
```bash
git push origin main
```

### Step 2: Connect to Render
1. Go to https://render.com
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
6. Click "Create Web Service"

### Step 3: Done!
Render will automatically deploy on every push to main.

Your app will be live at: `https://your-app-name.onrender.com`

---

## Option 3: Full Stack on Railway (Also good)

Railway.app also supports WebSocket.

### Step 1: Go to Railway
https://railway.app

### Step 2: Create new project
- Click "New Project"
- Select "Deploy from GitHub"
- Connect your repo

### Step 3: Configure
- Railway auto-detects Node.js
- Set `PORT` environment variable if needed
- Logs will show your deployed URL

### Step 4: Deploy
Push to GitHub and Railway auto-deploys!

---

## Option 4: Full Stack on Heroku (Classic option)

Heroku also supports WebSocket.

### Step 1: Install Heroku CLI
```bash
npm install -g heroku
```

### Step 2: Login
```bash
heroku login
```

### Step 3: Create app
```bash
heroku create your-app-name
```

### Step 4: Deploy
```bash
git push heroku main
```

### Step 5: View logs
```bash
heroku logs --tail
```

Your app will be at: `https://your-app-name.herokuapp.com`

---

## Recommended: Deploy Frontend to Vercel + Backend to Render

This is the best approach:

### Frontend (Vercel)
- ✅ Fast, free, easy
- ✅ Handles static files perfectly
- ✅ Global CDN

### Backend (Render)
- ✅ Supports WebSocket
- ✅ Persistent connections
- ✅ Free tier available
- ✅ Auto-deploys from GitHub

### How to set this up:

1. **Split the code:**
   Create two repositories:
   - `game-frontend` (just the dist files)
   - `game-backend` (just the server folder)

   OR keep as monorepo and set different build commands.

2. **Deploy frontend to Vercel:**
   ```bash
   vercel
   ```
   When prompted, set public directory to `dist`

3. **Deploy backend to Render:**
   - Create new Web Service on Render
   - Select your repo
   - Set Start Command: `npm start`
   - Note the backend URL

4. **Update frontend to use backend URL:**
   In `main.js`:
   ```javascript
   const SIGNALING_SERVER = `wss://your-backend-on-render.onrender.com`;
   ```

5. **Redeploy frontend:**
   ```bash
   vercel --prod
   ```

---

## Quick Comparison

| Service | Free Tier | WebSocket | Build Time | Custom Domain |
|---------|-----------|-----------|------------|---------------|
| Vercel (Frontend) | ✅ Yes | ❌ No | ~1 min | ✅ Yes |
| Render | ✅ Yes | ✅ Yes | ~2 min | ✅ Yes |
| Railway | ⚠️ Limited | ✅ Yes | ~2 min | ✅ Yes |
| Heroku | ❌ No | ✅ Yes | ~3 min | ✅ Yes |

---

## My Recommendation

**Best for your app:** Render

1. Push code to GitHub
2. Connect GitHub to Render
3. Render auto-deploys on every push
4. WebSocket works perfectly
5. Free tier is generous
6. No credit card needed to start

### Deploy to Render in 5 minutes:

1. Go to https://render.com
2. Click "New Web Service"
3. Connect your GitHub repo
4. Select this repo
5. Leave settings as default
6. Click "Create Web Service"
7. Wait 2 minutes...
8. Your app is live! ✅

Get your URL from the Render dashboard.

---

## Environment Variables

Make sure to set these on your hosting:

```
NODE_ENV=production
PORT=3000 (Render sets this automatically)
```

---

## Troubleshooting

**"WebSocket connection failed"**
- Make sure backend is deployed on Render/Railway/Heroku (not Vercel)
- Update `SIGNALING_SERVER` URL in main.js
- Check that backend URL is accessible

**"Build failed"**
- Make sure `npm run build` works locally first
- Check that all dependencies are in package.json
- Verify Node version is 14+ (should be auto-detected)

**"Games not showing"**
- Make sure dist/ folder is deployed
- Verify vercel.json buildCommand is correct
- Check browser console for errors

---

## Support

For help with:
- **Render:** https://render.com/docs
- **Vercel:** https://vercel.com/docs
- **Railway:** https://railway.app/docs
- **Heroku:** https://devcenter.heroku.com

---

## Summary

**Fastest way to deploy this app:**

```bash
# Option A: Frontend to Vercel + Backend to Render
vercel                    # Deploy frontend
# Then deploy backend to Render (via GitHub)

# Option B: Everything to Render
# Just push to GitHub and Render auto-deploys
git push origin main
```

That's it! Your app is live! 🚀
