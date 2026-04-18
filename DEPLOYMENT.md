# Deployment Guide

## 🚀 Deploying Your Team Game Pairing App

### Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] `.env` file configured
- [ ] Dependencies installed (`npm install`)
- [ ] No console errors in browser or server
- [ ] Microphone and WebRTC working

## Option 1: Heroku (Recommended for Beginners)

### Step 1: Prepare Repository
```bash
git add .
git commit -m "Initial commit: Team game pairing app"
git branch -M main
```

### Step 2: Create Heroku App
```bash
npm install -g heroku
heroku login
heroku create your-app-name
```

### Step 3: Deploy
```bash
git push heroku main
heroku logs --tail
```

### Step 4: Update WSS URL (if needed)
In `main.js`, update:
```javascript
const SIGNALING_SERVER = `wss://${window.location.host}`;
```

## Option 2: Render.com

### Step 1: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/team-game-pairing.git
git branch -M main
git push -u origin main
```

### Step 2: Connect Render
1. Visit render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Set Build Command: `npm install`
5. Set Start Command: `npm start`
6. Add environment: `NODE_ENV=production`, `PORT=3000`

### Step 3: Deploy
Render automatically deploys on push!

## Option 3: AWS EC2

### Step 1: Launch EC2 Instance
1. t2.micro (free tier eligible)
2. Ubuntu 22.04 LTS
3. Security group: Allow ports 80, 443, 3000

### Step 2: SSH into Instance
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

### Step 3: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 4: Clone and Setup
```bash
git clone your-repo-url
cd team-game-pairing
npm install
```

### Step 5: Run with PM2 (Process Manager)
```bash
sudo npm install -g pm2
pm2 start server/index.js --name "game-pairing"
pm2 startup
pm2 save
```

### Step 6: Setup Nginx Reverse Proxy
```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/default
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Restart nginx:
```bash
sudo systemctl restart nginx
```

## Option 4: DigitalOcean App Platform

### Step 1: Create GitHub Connection
Push your code to GitHub

### Step 2: Create App
1. Visit app.digitalocean.com
2. Click "Create App"
3. Select GitHub repository
4. Choose "Node.js" environment

### Step 3: Configure
- Build Command: `npm install`
- Run Command: `npm start`
- Port: `3000`

### Step 4: Deploy
Click "Deploy" and wait!

## Production Optimizations

### 1. Enable HTTPS/WSS

Update `main.js`:
```javascript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const SIGNALING_SERVER = `${protocol}//${window.location.host}`;
```

### 2. Add SSL Certificate

**Using Let's Encrypt with Certbot:**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. Enable Compression

Add to `server/index.js`:
```javascript
import compression from 'compression';
app.use(compression());
```

### 4. Add CORS

```javascript
import cors from 'cors';
app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true
}));
```

### 5. Add Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### 6. Add Authentication

```javascript
const jwt = require('jsonwebtoken');

// On login
const token = jwt.sign({ userId }, 'SECRET_KEY', { expiresIn: '1h' });

// Middleware
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).send('No token');
  
  jwt.verify(token, 'SECRET_KEY', (err, decoded) => {
    if (err) return res.status(401).send('Invalid token');
    req.userId = decoded.userId;
    next();
  });
}
```

### 7. Database Integration

Add MongoDB for persistent scores:
```bash
npm install mongoose
```

Create models for users and games:
```javascript
const userSchema = new Schema({
  username: String,
  rating: Number,
  gamesPlayed: Number,
  gamesWon: Number
});
```

## Monitoring & Logging

### 1. Add Logging Library

```bash
npm install winston
```

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. Monitor with PM2

```bash
pm2 monitor
pm2 logs
pm2 status
```

### 3. Setup Error Tracking

Use Sentry:
```bash
npm install @sentry/node
```

```javascript
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: "YOUR_SENTRY_DSN" });
```

## Performance Tuning

### 1. Enable Caching

```javascript
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600');
  next();
});
```

### 2. Optimize Bundle Size

```bash
npm audit
npm update
npm dedupe
```

### 3. Use CDN for Static Assets

Configure Cloudflare or AWS CloudFront:
- Cache HTML, CSS, JS
- Enable compression
- Minimize requests

### 4. Add Service Worker for Offline

```javascript
// sw.js
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll([
        '/',
        '/main.js',
        '/style.css'
      ]);
    })
  );
});
```

## Environment Variables for Production

Create `.env.production`:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=your_db_url
JWT_SECRET=your_secret_key
SENTRY_DSN=your_sentry_dsn
CORS_ORIGIN=https://your-domain.com
```

Load in `server/index.js`:
```javascript
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
```

## Domain Setup

### 1. Buy Domain
- Namecheap
- GoDaddy
- Route53

### 2. Update DNS Records
Point to your server:
```
A Record: your-domain.com → YOUR_SERVER_IP
CNAME: www.your-domain.com → your-domain.com
```

### 3. Setup HTTPS
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Scaling for Many Users

### 1. Horizontal Scaling (Multiple Servers)

Use load balancer + sticky sessions:
```
User → Load Balancer → Server 1 (WebSocket 1)
                    → Server 2 (WebSocket 2)
                    → Server 3 (WebSocket 3)
```

### 2. Redis for Shared State

```javascript
import redis from 'redis';
const client = redis.createClient();

// Store queue in Redis
await client.lpush('waiting-queue', userId);
const queueSize = await client.llen('waiting-queue');
```

### 3. Message Queue (RabbitMQ/Kafka)

For scaling signaling across servers.

## Monitoring Checklist

- [ ] Server uptime (pingdom.com)
- [ ] Performance monitoring (New Relic, DataDog)
- [ ] Error tracking (Sentry)
- [ ] Log aggregation (ELK, Splunk)
- [ ] Database backups
- [ ] SSL certificate auto-renewal
- [ ] Load testing (Apache JMeter, k6)

## Troubleshooting Deployment

### WebSocket Connection Fails
- Check firewall allows port 3000
- Verify WSS vs WS in frontend
- Enable CORS if cross-origin

### Microphone Permission Issues
- Must use HTTPS in production
- Add microphone permission in headers

### High CPU Usage
- Optimize WebRTC ICE candidate gathering
- Reduce polling frequency
- Add load balancing

### Memory Leaks
- Check for unclosed connections
- Monitor with `node --inspect`
- Use Chrome DevTools for profiling

## Post-Deployment

1. Test with real users
2. Monitor performance metrics
3. Set up automated backups
4. Plan for scaling
5. Create incident response plan
6. Document deployment process

## Useful Commands

```bash
# Check server status
pm2 status
pm2 logs app-name

# Monitor resources
htop

# Check port usage
lsof -i :3000
netstat -tulpn | grep 3000

# View SSL certificate
openssl x509 -in /etc/ssl/certs/your-cert.crt -text

# Restart services
sudo systemctl restart nginx
pm2 restart all
```

## Cost Estimation

| Service | Cost |
|---------|------|
| Heroku (Standard) | $7-50/month |
| Render (Standard) | $7/month |
| AWS EC2 t2.micro (free tier) | Free/month |
| DigitalOcean (Basic) | $6/month |
| Domain (yearly) | $10-15/year |

## Next Steps

1. Choose deployment platform
2. Set up domain and SSL
3. Configure environment variables
4. Deploy and test
5. Monitor performance
6. Optimize based on metrics

Happy deploying! 🚀
