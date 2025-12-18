# Brevis Analytics Dashboard

A full-stack analytics dashboard for tracking and visualizing blockchain data from the Brevis Incentra contract on Base network, with PancakeSwap V3 integration as a fallback data source.

## Overview

This project provides real-time analytics and insights into:
- Brevis Incentra reward distribution and user participation
- User leaderboards and activity metrics
- Time-series analysis of reward claims
- Export capabilities for data analysis

## Tech Stack

### Backend
- **Node.js** with Express
- **ethers.js v6** for blockchain interaction
- **node-cron** for scheduled data refreshes
- **axios** for HTTP requests

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **TanStack Query** for data fetching
- **Lucide React** for icons

## Project Structure

```
brevis-analytic-dashboard/
├── backend/              # Node.js backend server
│   ├── scripts/          # Data fetching and processing scripts
│   ├── routes/           # API route handlers
│   ├── config.js         # Configuration and contract addresses
│   ├── server.js         # Express server entry point
│   └── package.json
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Utility functions
│   └── package.json
├── data/                 # Cached JSON data files
└── README.md
```

## Getting Started

### Prerequisites
- Node.js v20.x or higher
- Alchemy API key (for RPC access)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd brevis-analytic-dashboard
```

2. Install backend dependencies
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your ALCHEMY_API_KEY
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### Running Locally

1. Start the backend server
```bash
cd backend
npm run dev
```
The backend will run on http://localhost:3001

2. Start the frontend dev server
```bash
cd frontend
npm run dev
```
The frontend will run on http://localhost:5173

### Manual Data Fetch

Fetch Brevis data:
```bash
cd backend
npm run fetch:brevis
```

Fetch PancakeSwap data:
```bash
cd backend
npm run fetch:pancake
```

Process analytics:
```bash
cd backend
npm run process
```

## API Endpoints

- `GET /api/analytics` - Get processed analytics data
- `POST /api/refresh` - Trigger manual data refresh

## Features

- **Real-time Metrics**: Track total events, unique users, and reward distribution
- **Interactive Charts**: Visualize trends over time
- **Leaderboard**: Top 20 users by rewards earned
- **Recent Activity**: Latest reward claim events
- **Search & Filter**: Filter data by address and date range
- **CSV Export**: Export leaderboard data for analysis
- **Auto-refresh**: Data updates every 6 hours automatically

## Deployment

See deployment checklist and configuration in the `/docs` folder (coming soon).

## License

MIT
