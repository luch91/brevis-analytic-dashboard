import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  PANCAKESWAP_CONFIG,
  RPC_CONFIG,
  BLOCK_CONFIG,
  ABIS,
  DATA_PATHS
} from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility function to sleep/delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Rate limiter class
class RateLimiter {
  constructor(requestsPerSecond) {
    this.requestsPerSecond = requestsPerSecond;
    this.lastRequestTime = 0;
  }

  async waitForSlot() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / this.requestsPerSecond;

    if (timeSinceLastRequest < minInterval) {
      await sleep(minInterval - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }
}

// Retry logic wrapper
async function retryWithBackoff(fn, maxRetries = BLOCK_CONFIG.MAX_RETRIES) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt < maxRetries) {
        const delayMs = BLOCK_CONFIG.RETRY_DELAY_MS * attempt;
        console.log(`⏳ Retrying in ${delayMs}ms...`);
        await sleep(delayMs);
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

// Calculate blocks for last N days on BSC (~3 sec per block)
function getBlockRangeForDays(currentBlock, days = 7) {
  const blocksPerDay = (24 * 60 * 60) / 3; // ~28,800 blocks per day on BSC
  const totalBlocks = Math.floor(blocksPerDay * days);
  return {
    fromBlock: currentBlock - totalBlocks,
    toBlock: currentBlock,
    totalBlocks
  };
}

// Main fetch function
async function fetchPancakeSwapData() {
  console.log('🥞 Starting PancakeSwap V3 data fetch...\n');

  try {
    // Initialize provider for BSC
    console.log('📡 Connecting to BSC network...');
    const provider = new ethers.JsonRpcProvider(RPC_CONFIG.BSC);

    // Verify connection
    const network = await retryWithBackoff(() => provider.getNetwork());
    console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})\n`);

    // Get current block
    const currentBlock = await retryWithBackoff(() => provider.getBlockNumber());
    console.log(`📦 Current block: ${currentBlock.toLocaleString()}`);

    // Calculate block range for last 7 days
    const { fromBlock, toBlock, totalBlocks } = getBlockRangeForDays(currentBlock, 7);
    console.log(`🔍 Fetching swaps from last 7 days`);
    console.log(`📊 Block range: ${fromBlock.toLocaleString()} to ${toBlock.toLocaleString()}`);
    console.log(`📊 Total blocks to scan: ${totalBlocks.toLocaleString()}\n`);

    // Initialize contract for USDT-USDC pool
    const poolAddress = PANCAKESWAP_CONFIG.POOLS.USDT_USDC;
    console.log(`🏊 Pool Address: ${poolAddress}`);

    const poolContract = new ethers.Contract(
      poolAddress,
      ABIS.PANCAKESWAP_V3_POOL,
      provider
    );

    // Initialize rate limiter (slower for public RPC)
    const rateLimiter = new RateLimiter(0.25); // 1 request every 4 seconds

    // Fetch events in chunks
    const CHUNK_SIZE = 2000; // Very small chunks for public RPC rate limits
    const allSwaps = [];
    let processedBlocks = 0;

    console.log('📥 Fetching Swap events...\n');

    for (let start = fromBlock; start <= toBlock; start += CHUNK_SIZE) {
      const end = Math.min(start + CHUNK_SIZE - 1, toBlock);

      // Rate limiting
      await rateLimiter.waitForSlot();

      try {
        console.log(`📥 Fetching swaps from block ${start.toLocaleString()} to ${end.toLocaleString()}...`);

        const swaps = await retryWithBackoff(async () => {
          const filter = poolContract.filters.Swap();
          return await poolContract.queryFilter(filter, start, end);
        });

        if (swaps.length > 0) {
          console.log(`   ✅ Found ${swaps.length} swaps`);
          allSwaps.push(...swaps);
        } else {
          console.log(`   ℹ️  No swaps found in this range`);
        }

        processedBlocks += (end - start + 1);

        // Progress update
        if (processedBlocks % 50000 === 0 || end === toBlock) {
          const progress = ((processedBlocks / totalBlocks) * 100).toFixed(1);
          console.log(`📊 Progress: ${progress}% (${processedBlocks.toLocaleString()}/${totalBlocks.toLocaleString()} blocks)\n`);
        }

      } catch (error) {
        console.error(`❌ Error fetching swaps for block range ${start}-${end}:`, error.message);
        console.log('⏭️  Continuing with next chunk...\n');
      }
    }

    console.log(`\n✅ Swap fetch complete! Total swaps found: ${allSwaps.length}\n`);

    // Process and format swaps
    console.log('🔄 Processing swap events...');
    const formattedSwaps = [];

    for (const swap of allSwaps) {
      try {
        const block = await retryWithBackoff(() => provider.getBlock(swap.blockNumber));

        // Extract swap details
        const sender = swap.args.sender;
        const recipient = swap.args.recipient;
        const amount0 = swap.args.amount0;
        const amount1 = swap.args.amount1;
        const sqrtPriceX96 = swap.args.sqrtPriceX96;
        const liquidity = swap.args.liquidity;
        const tick = swap.args.tick;

        formattedSwaps.push({
          sender,
          recipient,
          trader: sender, // Using sender as trader address
          amount0: amount0.toString(),
          amount1: amount1.toString(),
          amount0Formatted: ethers.formatUnits(amount0 < 0 ? -amount0 : amount0, 18),
          amount1Formatted: ethers.formatUnits(amount1 < 0 ? -amount1 : amount1, 18),
          sqrtPriceX96: sqrtPriceX96.toString(),
          liquidity: liquidity.toString(),
          tick: Number(tick),
          txHash: swap.transactionHash,
          blockNumber: swap.blockNumber,
          blockTimestamp: block.timestamp,
          timestampDate: new Date(block.timestamp * 1000).toISOString(),
        });

      } catch (error) {
        console.error(`⚠️  Error processing swap at block ${swap.blockNumber}:`, error.message);
      }
    }

    console.log(`✅ Processed ${formattedSwaps.length} swaps\n`);

    // Save to file
    console.log('💾 Saving data to file...');
    const dataDir = path.join(__dirname, '../../data');

    // Ensure data directory exists
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    const outputPath = path.join(__dirname, '../../', DATA_PATHS.PANCAKESWAP_SWAPS);

    const output = {
      metadata: {
        fetchedAt: new Date().toISOString(),
        network: network.name,
        chainId: Number(network.chainId),
        poolAddress: poolAddress,
        poolName: 'USDT-USDC',
        fromBlock,
        toBlock,
        daysIncluded: 7,
        totalSwaps: formattedSwaps.length,
      },
      swaps: formattedSwaps,
    };

    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`✅ Data saved to: ${outputPath}\n`);

    // Summary
    console.log('📊 Summary:');
    console.log(`   Total Swaps: ${formattedSwaps.length}`);
    console.log(`   Unique Traders: ${new Set(formattedSwaps.map(s => s.trader)).size}`);
    console.log(`   Block Range: ${fromBlock.toLocaleString()} - ${toBlock.toLocaleString()}`);
    console.log(`   Time Range: ${formattedSwaps[0]?.timestampDate || 'N/A'} to ${formattedSwaps[formattedSwaps.length - 1]?.timestampDate || 'N/A'}`);
    console.log(`   Pool: USDT-USDC (${poolAddress})`);
    console.log('\n✨ PancakeSwap data fetch complete!\n');

  } catch (error) {
    console.error('\n❌ Fatal error during data fetch:', error);
    process.exit(1);
  }
}

// Run the script
fetchPancakeSwapData();
