import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { DATA_PATHS } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to format dates to YYYY-MM-DD
function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toISOString().split('T')[0];
}

// Helper function to format addresses with checksum (simplified)
function formatAddress(address) {
  if (!address) return '';
  return address.toLowerCase();
}

// Calculate volume from swap amounts
function calculateSwapVolume(swap) {
  // Using absolute values of amounts (USDT/USDC are both ~$1)
  const amount0 = Math.abs(parseFloat(swap.amount0Formatted));
  const amount1 = Math.abs(parseFloat(swap.amount1Formatted));
  // Return the larger amount as approximate USD volume
  return Math.max(amount0, amount1);
}

async function processAnalytics() {
  console.log('🔄 Starting analytics processing...\n');

  try {
    // Read PancakeSwap swap data
    const swapDataPath = path.join(__dirname, '../../', DATA_PATHS.PANCAKESWAP_SWAPS);
    console.log(`📖 Reading swap data from: ${swapDataPath}`);

    let swapData;
    try {
      const rawData = await fs.readFile(swapDataPath, 'utf-8');
      swapData = JSON.parse(rawData);
    } catch (error) {
      console.error('❌ Error reading swap data file:', error.message);
      console.error('💡 Please run "npm run fetch:pancake" first to generate data.');
      process.exit(1);
    }

    const swaps = swapData.swaps || [];
    console.log(`✅ Loaded ${swaps.length} swaps\n`);

    if (swaps.length === 0) {
      console.warn('⚠️  No swaps found. Cannot generate analytics.');
      process.exit(1);
    }

    // 1. Summary Metrics
    console.log('📊 Calculating summary metrics...');

    const uniqueTraders = new Set(swaps.map(s => formatAddress(s.trader)));
    const totalVolume = swaps.reduce((sum, swap) => sum + calculateSwapVolume(swap), 0);
    const avgVolumePerSwap = totalVolume / swaps.length;

    const timestamps = swaps.map(s => s.blockTimestamp);
    const firstSwapDate = new Date(Math.min(...timestamps) * 1000).toISOString();
    const lastSwapDate = new Date(Math.max(...timestamps) * 1000).toISOString();

    const summaryMetrics = {
      totalSwaps: swaps.length,
      uniqueTraders: uniqueTraders.size,
      totalVolume: totalVolume,
      totalVolumeFormatted: `$${totalVolume.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      avgVolumePerSwap: avgVolumePerSwap,
      avgVolumePerTrader: totalVolume / uniqueTraders.size,
      firstSwapDate,
      lastSwapDate,
    };

    console.log(`   Total Swaps: ${summaryMetrics.totalSwaps}`);
    console.log(`   Unique Traders: ${summaryMetrics.uniqueTraders}`);
    console.log(`   Total Volume: ${summaryMetrics.totalVolumeFormatted}`);
    console.log();

    // 2. Time Series Data (daily aggregation)
    console.log('📈 Generating time series data...');

    const dailyData = {};

    swaps.forEach(swap => {
      const date = formatDate(swap.blockTimestamp);

      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          swapCount: 0,
          volume: 0,
          uniqueTraders: new Set(),
        };
      }

      dailyData[date].swapCount++;
      dailyData[date].volume += calculateSwapVolume(swap);
      dailyData[date].uniqueTraders.add(formatAddress(swap.trader));
    });

    const swapsPerDay = Object.values(dailyData)
      .map(day => ({
        date: day.date,
        count: day.swapCount,
        volume: parseFloat(day.volume.toFixed(2)),
        uniqueTraders: day.uniqueTraders.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    console.log(`   Generated ${swapsPerDay.length} days of data\n`);

    // 3. Trader Leaderboard (top 20)
    console.log('🏆 Building trader leaderboard...');

    const traderStats = {};

    swaps.forEach(swap => {
      const trader = formatAddress(swap.trader);

      if (!traderStats[trader]) {
        traderStats[trader] = {
          address: swap.trader, // Keep original format
          swapCount: 0,
          totalVolume: 0,
          firstSeen: swap.blockTimestamp,
          lastSeen: swap.blockTimestamp,
        };
      }

      traderStats[trader].swapCount++;
      traderStats[trader].totalVolume += calculateSwapVolume(swap);
      traderStats[trader].firstSeen = Math.min(traderStats[trader].firstSeen, swap.blockTimestamp);
      traderStats[trader].lastSeen = Math.max(traderStats[trader].lastSeen, swap.blockTimestamp);
    });

    const leaderboard = Object.values(traderStats)
      .map(trader => ({
        address: trader.address,
        swapCount: trader.swapCount,
        totalVolume: parseFloat(trader.totalVolume.toFixed(2)),
        totalVolumeFormatted: `$${trader.totalVolume.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        avgVolumePerSwap: parseFloat((trader.totalVolume / trader.swapCount).toFixed(2)),
        firstSeen: trader.firstSeen,
        firstSeenDate: new Date(trader.firstSeen * 1000).toISOString(),
        lastSeen: trader.lastSeen,
        lastSeenDate: new Date(trader.lastSeen * 1000).toISOString(),
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 20);

    console.log(`   Top trader: ${leaderboard[0]?.address} with ${leaderboard[0]?.totalVolumeFormatted} volume\n`);

    // 4. Recent Activity (last 50 swaps)
    console.log('📝 Extracting recent activity...');

    const recentActivity = swaps
      .sort((a, b) => b.blockTimestamp - a.blockTimestamp)
      .slice(0, 50)
      .map(swap => ({
        trader: swap.trader,
        volume: parseFloat(calculateSwapVolume(swap).toFixed(2)),
        volumeFormatted: `$${calculateSwapVolume(swap).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        timestamp: swap.blockTimestamp,
        timestampDate: swap.timestampDate,
        txHash: swap.txHash,
        blockNumber: swap.blockNumber,
      }));

    console.log(`   Captured ${recentActivity.length} recent swaps\n`);

    // 5. Volume Distribution
    console.log('💰 Analyzing volume distribution...');

    const volumeRanges = {
      micro: { min: 0, max: 100, count: 0, volume: 0 },
      small: { min: 100, max: 1000, count: 0, volume: 0 },
      medium: { min: 1000, max: 10000, count: 0, volume: 0 },
      large: { min: 10000, max: 100000, count: 0, volume: 0 },
      whale: { min: 100000, max: Infinity, count: 0, volume: 0 },
    };

    swaps.forEach(swap => {
      const volume = calculateSwapVolume(swap);

      for (const [key, range] of Object.entries(volumeRanges)) {
        if (volume >= range.min && volume < range.max) {
          range.count++;
          range.volume += volume;
          break;
        }
      }
    });

    const volumeDistribution = Object.entries(volumeRanges).map(([key, data]) => ({
      range: key,
      min: data.min,
      max: data.max === Infinity ? 'Infinity' : data.max,
      swapCount: data.count,
      totalVolume: parseFloat(data.volume.toFixed(2)),
      percentage: parseFloat(((data.count / swaps.length) * 100).toFixed(2)),
    }));

    console.log(`   Largest category: ${volumeDistribution.sort((a, b) => b.swapCount - a.swapCount)[0].range}\n`);

    // Compile analytics output
    const analytics = {
      metadata: {
        generatedAt: new Date().toISOString(),
        dataSource: 'PancakeSwap V3 USDT-USDC Pool (BSC)',
        sourceFile: DATA_PATHS.PANCAKESWAP_SWAPS,
        poolAddress: swapData.metadata?.poolAddress,
        fromBlock: swapData.metadata?.fromBlock,
        toBlock: swapData.metadata?.toBlock,
        daysIncluded: swapData.metadata?.daysIncluded,
      },
      summary: summaryMetrics,
      timeSeries: {
        swapsPerDay,
      },
      leaderboard,
      recentActivity,
      volumeDistribution,
    };

    // Save analytics
    console.log('💾 Saving analytics data...');
    const outputPath = path.join(__dirname, '../../', DATA_PATHS.ANALYTICS);
    await fs.writeFile(outputPath, JSON.stringify(analytics, null, 2));
    console.log(`✅ Analytics saved to: ${outputPath}\n`);

    // Final summary
    console.log('✨ Analytics processing complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total Swaps: ${summaryMetrics.totalSwaps.toLocaleString()}`);
    console.log(`   Unique Traders: ${summaryMetrics.uniqueTraders.toLocaleString()}`);
    console.log(`   Total Volume: ${summaryMetrics.totalVolumeFormatted}`);
    console.log(`   Time Range: ${swapsPerDay.length} days`);
    console.log(`   Leaderboard: Top ${leaderboard.length} traders`);
    console.log(`   Recent Activity: Last ${recentActivity.length} swaps\n`);

  } catch (error) {
    console.error('\n❌ Fatal error during analytics processing:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
processAnalytics();
