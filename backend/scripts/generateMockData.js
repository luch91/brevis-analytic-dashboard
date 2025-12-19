import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { DATA_PATHS } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate random address
function generateAddress() {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

// Generate trader pool (20 unique traders, some very active)
function generateTraderPool() {
  const traders = [];
  for (let i = 0; i < 20; i++) {
    traders.push({
      address: generateAddress(),
      weight: Math.random() * 100, // Activity weight
    });
  }
  return traders;
}

// Generate random swap
function generateSwap(traders, timestamp, blockNumber) {
  // Pick a trader (weighted towards active traders)
  const randomIndex = Math.floor(Math.pow(Math.random(), 2) * traders.length);
  const trader = traders[randomIndex];

  // Generate swap amounts (USDT/USDC are 1:1, so amounts are similar)
  const baseAmount = Math.random() * 50000; // 0 to 50k
  const amount0 = (Math.random() > 0.5 ? 1 : -1) * baseAmount;
  const amount1 = -amount0 * (0.99 + Math.random() * 0.02); // Small price variation

  return {
    sender: trader.address,
    recipient: trader.address,
    trader: trader.address,
    amount0: amount0.toString(),
    amount1: amount1.toString(),
    amount0Formatted: Math.abs(amount0).toFixed(6),
    amount1Formatted: Math.abs(amount1).toFixed(6),
    sqrtPriceX96: '79228162514264337593543950336',
    liquidity: '1000000000000000000',
    tick: Math.floor(Math.random() * 1000) - 500,
    txHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    blockNumber,
    blockTimestamp: timestamp,
    timestampDate: new Date(timestamp * 1000).toISOString(),
  };
}

async function generateMockData() {
  console.log('🎲 Generating mock PancakeSwap data...\n');

  const traders = generateTraderPool();
  const swaps = [];

  // Generate 7 days of data
  const now = Math.floor(Date.now() / 1000);
  const daysAgo7 = now - (7 * 24 * 60 * 60);

  // Generate varying number of swaps per day (50-200 swaps/day)
  let currentBlock = 72000000;

  for (let day = 0; day < 7; day++) {
    const dayStart = daysAgo7 + (day * 24 * 60 * 60);
    const swapsToday = 50 + Math.floor(Math.random() * 150);

    console.log(`📅 Day ${day + 1}: Generating ${swapsToday} swaps...`);

    for (let i = 0; i < swapsToday; i++) {
      const timestamp = dayStart + Math.floor(Math.random() * 24 * 60 * 60);
      const swap = generateSwap(traders, timestamp, currentBlock);
      swaps.push(swap);
      currentBlock += Math.floor(Math.random() * 10) + 1;
    }
  }

  // Sort by timestamp
  swaps.sort((a, b) => a.blockTimestamp - b.blockTimestamp);

  console.log(`\n✅ Generated ${swaps.length} swaps from ${traders.length} unique traders\n`);

  // Create output structure
  const output = {
    metadata: {
      fetchedAt: new Date().toISOString(),
      network: 'bnb',
      chainId: 56,
      poolAddress: '0x92b7807bf19b7dddf89b706143896d05228f3121',
      poolName: 'USDT-USDC',
      fromBlock: swaps[0].blockNumber,
      toBlock: swaps[swaps.length - 1].blockNumber,
      daysIncluded: 7,
      totalSwaps: swaps.length,
      note: 'MOCK DATA - Generated for testing purposes',
    },
    swaps,
  };

  // Save to file
  const outputPath = path.join(__dirname, DATA_PATHS.PANCAKESWAP_SWAPS);
  const dataDir = path.dirname(outputPath);

  // Ensure data directory exists
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }

  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));

  console.log(`💾 Mock data saved to: ${outputPath}`);
  console.log('\n📊 Summary:');
  console.log(`   Total Swaps: ${swaps.length}`);
  console.log(`   Unique Traders: ${traders.length}`);
  console.log(`   Time Range: ${swaps[0].timestampDate} to ${swaps[swaps.length - 1].timestampDate}`);
  console.log('\n✨ Mock data generation complete!\n');
  console.log('💡 Next step: Run "npm run process" to generate analytics\n');
}

generateMockData();
