import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DATA_PATHS } from './config.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Helper function to read analytics data
async function readAnalyticsData() {
  try {
    const analyticsPath = path.join(__dirname, DATA_PATHS.ANALYTICS);
    const data = await fs.readFile(analyticsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('Analytics data not found. Please run data fetch and processing first.');
    }
    throw error;
  }
}

// Helper function to run data refresh
async function refreshData() {
  console.log('\n🔄 Starting data refresh...');

  try {
    // Step 1: Fetch PancakeSwap data
    console.log('📥 Fetching PancakeSwap swap data...');
    const { stdout: fetchOut, stderr: fetchErr } = await execAsync('node scripts/fetchPancakeSwapData.js', {
      cwd: __dirname,
      timeout: 600000, // 10 minutes timeout
    });

    if (fetchErr) console.error('Fetch warnings:', fetchErr);
    console.log('✅ Data fetch complete');

    // Step 2: Process analytics
    console.log('📊 Processing analytics...');
    const { stdout: processOut, stderr: processErr } = await execAsync('node scripts/processAnalytics.js', {
      cwd: __dirname,
      timeout: 60000, // 1 minute timeout
    });

    if (processErr) console.error('Process warnings:', processErr);
    console.log('✅ Analytics processing complete\n');

    return { success: true, message: 'Data refresh completed successfully' };
  } catch (error) {
    console.error('❌ Data refresh failed:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// API Routes
// ============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Get analytics data
app.get('/api/analytics', async (req, res) => {
  try {
    const analytics = await readAnalyticsData();

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error reading analytics:', error.message);

    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      hint: 'Run "npm run fetch:pancake" and "npm run process" to generate data',
    });
  }
});

// Manual data refresh endpoint
app.post('/api/refresh', async (req, res) => {
  try {
    console.log('🔄 Manual refresh triggered via API');

    // Send immediate response
    res.json({
      success: true,
      message: 'Data refresh started',
      timestamp: new Date().toISOString(),
      note: 'Refresh is running in the background. Check logs for progress.',
    });

    // Run refresh in background
    refreshData().catch(err => {
      console.error('Background refresh error:', err);
    });

  } catch (error) {
    console.error('Error triggering refresh:', error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get metadata about data freshness
app.get('/api/metadata', async (req, res) => {
  try {
    const analytics = await readAnalyticsData();

    res.json({
      success: true,
      metadata: analytics.metadata,
      summary: {
        totalSwaps: analytics.summary.totalSwaps,
        uniqueTraders: analytics.summary.uniqueTraders,
        totalVolume: analytics.summary.totalVolumeFormatted,
        dataRange: {
          from: analytics.summary.firstSwapDate,
          to: analytics.summary.lastSwapDate,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Scheduled Jobs
// ============================================================================

// Auto-refresh data every 6 hours
// Cron schedule: "0 */6 * * *" means: at minute 0 of every 6th hour
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 */6 * * *';

console.log(`⏰ Scheduling auto-refresh with cron: ${CRON_SCHEDULE}`);

cron.schedule(CRON_SCHEDULE, async () => {
  console.log('\n⏰ Scheduled data refresh triggered');
  await refreshData();
}, {
  scheduled: true,
  timezone: 'UTC',
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 PancakeSwap Analytics Dashboard - Backend Server');
  console.log('='.repeat(60));
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`⏰ Auto-refresh schedule: ${CRON_SCHEDULE} (UTC)`);
  console.log('\n📊 Available API Endpoints:');
  console.log(`   GET  /health           - Health check`);
  console.log(`   GET  /api/analytics    - Get full analytics data`);
  console.log(`   GET  /api/metadata     - Get data metadata & summary`);
  console.log(`   POST /api/refresh      - Trigger manual data refresh`);
  console.log('\n💡 Tip: Run "npm run fetch:pancake" and "npm run process" to generate initial data');
  console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});
