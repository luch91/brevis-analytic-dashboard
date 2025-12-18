# Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Verify all dependencies are installed
  ```bash
  cd backend && npm install
  cd ../frontend && npm install
  ```

- [ ] Test local builds
  ```bash
  cd frontend && npm run build
  cd ../backend && npm start
  ```

- [ ] Ensure `.env` files are properly configured (NOT committed to git)

### 2. Data Preparation
- [ ] Generate mock data (for demo)
  ```bash
  cd backend
  npm run setup
  ```

- [ ] OR fetch real data (if contract addresses available)
  ```bash
  npm run fetch:pancake
  npm run process
  ```

### 3. Code Quality
- [ ] Remove console.logs from production code
- [ ] Check for hardcoded API URLs
- [ ] Verify error handling is in place
- [ ] Test all features locally

---

## Deployment Options

### Option 1: Deploy Frontend to Vercel (Recommended)

#### Step 1: Prepare Frontend
```bash
cd frontend
npm run build
```

#### Step 2: Deploy to Vercel
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow prompts:
   - Project name: `pancakeswap-analytics`
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

#### Step 3: Set Environment Variables in Vercel Dashboard
1. Go to vercel.com → Your Project → Settings → Environment Variables
2. Add:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

#### Step 4: Deploy Backend
**Options for backend:**

**A. Railway.app (Easiest)**
1. Go to railway.app
2. Create new project from GitHub
3. Select `backend` folder as root
4. Add environment variables:
   ```
   ALCHEMY_API_KEY=your_key
   PORT=3001
   NODE_ENV=production
   ```
5. Railway will auto-deploy

**B. Render.com**
1. Create new Web Service
2. Connect GitHub repo
3. Root directory: `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables

**C. Heroku**
1. Create new app
2. Add Node.js buildpack
3. Set root to `backend`
4. Configure environment variables
5. Deploy via GitHub or CLI

---

### Option 2: Deploy Both to Same Platform

#### Vercel (Full Stack)
1. Add `vercel.json` to root (already created)
2. Convert backend to serverless functions:
   - Move routes to `api/` folder
   - Each route becomes a serverless function
   - Update imports

3. Deploy:
   ```bash
   vercel
   ```

---

## Environment Variables Reference

### Backend (.env)
```bash
# Required
ALCHEMY_API_KEY=your_alchemy_key_here
PORT=3001
NODE_ENV=production

# Optional
BSC_RPC_URL=https://bsc-dataseed1.binance.org
CRON_SCHEDULE=0 */6 * * *
```

### Frontend (.env)
```bash
# Required
VITE_API_URL=https://your-backend-url.com
```

---

## Post-Deployment Checklist

### 1. Verify Deployment
- [ ] Frontend loads successfully
- [ ] API endpoints respond correctly
  - GET /health
  - GET /api/analytics
  - GET /api/metadata
- [ ] Data displays in dashboard
- [ ] Charts render properly
- [ ] Filters work correctly
- [ ] CSV export functions

### 2. Test Features
- [ ] Search by address
- [ ] Date range filtering
- [ ] Refresh data button
- [ ] Export CSV
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] External links to BscScan

### 3. Performance
- [ ] Check Lighthouse score (aim for 90+)
- [ ] Verify loading times
- [ ] Test with slow 3G connection
- [ ] Check bundle size

### 4. Security
- [ ] Verify no API keys in frontend code
- [ ] Check CORS settings
- [ ] Ensure HTTPS is enabled
- [ ] Verify environment variables are set correctly

---

## Troubleshooting

### Common Issues

#### 1. "Failed to fetch analytics"
**Solution:**
- Check `VITE_API_URL` is set correctly
- Verify backend is running and accessible
- Check CORS settings in backend

#### 2. "No data available"
**Solution:**
- Run `npm run setup` in backend
- Check `/data` folder has JSON files
- Verify file paths in `config.js`

#### 3. Build fails
**Solution:**
- Clear `node_modules` and reinstall
- Check Node.js version (20.x required)
- Verify all imports are correct

#### 4. CSV export doesn't work
**Solution:**
- Check browser console for errors
- Verify data exists before export
- Test in different browser

---

## Quick Start Commands

### Local Development
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production Build
```bash
# Backend
cd backend
npm run setup  # Generate data
npm start      # Start server

# Frontend
cd frontend
npm run build  # Build for production
```

### Deploy to Vercel
```bash
cd frontend
vercel --prod
```

---

## Notes

- **Mock Data**: Currently using generated mock data. To use real blockchain data, update contract addresses in `backend/config.js` and run `npm run fetch:pancake`

- **Auto-Refresh**: Backend refreshes data every 6 hours by default (configurable via `CRON_SCHEDULE`)

- **Cost**: Using public BSC RPC is free but slow. Consider using paid RPC (Alchemy/QuickNode) for production

- **Scaling**: For high traffic, consider:
  - Redis caching
  - CDN for frontend
  - Load balancer for backend
  - Database for persistent storage

---

## Support

For issues or questions:
1. Check GitHub issues
2. Review backend logs
3. Check Vercel deployment logs
4. Verify environment variables

**Project Structure:**
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Data: JSON file caching
- Analytics: Processed from blockchain events

**Last Updated:** 2025-12-18
