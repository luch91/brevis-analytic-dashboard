import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BREVIS_CONFIG,
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
        const delayMs = BLOCK_CONFIG.RETRY_DELAY_MS * attempt; // Exponential backoff
        console.log(`⏳ Retrying in ${delayMs}ms...`);
        await sleep(delayMs);
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

// Main fetch function
async function fetchBrevisData() {
  console.log('🚀 Starting Brevis Incentra data fetch...\n');

  // Validate configuration
  if (BREVIS_CONFIG.INCENTRA_CONTRACT === '0x0000000000000000000000000000000000000000') {
    console.error('⚠️  WARNING: Brevis Incentra contract address is not configured!');
    console.error('Please update BREVIS_CONFIG.INCENTRA_CONTRACT in config.js');
    console.error('Exiting...\n');
    process.exit(1);
  }

  try {
    // Initialize provider
    console.log('📡 Connecting to Base network...');
    const provider = new ethers.JsonRpcProvider(RPC_CONFIG.BASE);

    // Verify connection
    const network = await retryWithBackoff(() => provider.getNetwork());
    console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})\n`);

    // Get current block
    const currentBlock = await retryWithBackoff(() => provider.getBlockNumber());
    console.log(`📦 Current block: ${currentBlock.toLocaleString()}`);

    // Calculate block range
    const fromBlock = currentBlock - BLOCK_CONFIG.BREVIS_BLOCK_RANGE;
    const toBlock = currentBlock;
    console.log(`🔍 Fetching events from block ${fromBlock.toLocaleString()} to ${toBlock.toLocaleString()}`);
    console.log(`📊 Total blocks to scan: ${BLOCK_CONFIG.BREVIS_BLOCK_RANGE.toLocaleString()}\n`);

    // Initialize contract
    const contract = new ethers.Contract(
      BREVIS_CONFIG.INCENTRA_CONTRACT,
      ABIS.BREVIS_INCENTRA,
      provider
    );

    // Initialize rate limiter
    const rateLimiter = new RateLimiter(BLOCK_CONFIG.RATE_LIMIT_RPS);

    // Fetch events in chunks to avoid RPC limits
    const CHUNK_SIZE = 10000; // Adjust based on RPC provider limits
    const allEvents = [];
    let processedBlocks = 0;

    for (let start = fromBlock; start <= toBlock; start += CHUNK_SIZE) {
      const end = Math.min(start + CHUNK_SIZE - 1, toBlock);

      // Rate limiting
      await rateLimiter.waitForSlot();

      try {
        console.log(`📥 Fetching events from block ${start.toLocaleString()} to ${end.toLocaleString()}...`);

        const events = await retryWithBackoff(async () => {
          const filter = contract.filters.RewardClaimed();
          return await contract.queryFilter(filter, start, end);
        });

        if (events.length > 0) {
          console.log(`   ✅ Found ${events.length} events`);
          allEvents.push(...events);
        } else {
          console.log(`   ℹ️  No events found in this range`);
        }

        processedBlocks += (end - start + 1);

        // Progress update every 10,000 blocks
        if (processedBlocks % 10000 === 0 || end === toBlock) {
          const progress = ((processedBlocks / BLOCK_CONFIG.BREVIS_BLOCK_RANGE) * 100).toFixed(1);
          console.log(`📊 Progress: ${progress}% (${processedBlocks.toLocaleString()}/${BLOCK_CONFIG.BREVIS_BLOCK_RANGE.toLocaleString()} blocks)\n`);
        }

      } catch (error) {
        console.error(`❌ Error fetching events for block range ${start}-${end}:`, error.message);
        console.log('⏭️  Continuing with next chunk...\n');
      }
    }

    console.log(`\n✅ Event fetch complete! Total events found: ${allEvents.length}\n`);

    // Process and format events
    console.log('🔄 Processing events...');
    const formattedEvents = [];

    for (const event of allEvents) {
      try {
        const block = await retryWithBackoff(() => provider.getBlock(event.blockNumber));

        formattedEvents.push({
          user: event.args.user,
          amount: event.args.amount.toString(),
          amountFormatted: ethers.formatEther(event.args.amount),
          timestamp: Number(event.args.timestamp),
          timestampDate: new Date(Number(event.args.timestamp) * 1000).toISOString(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          blockTimestamp: block.timestamp,
        });

      } catch (error) {
        console.error(`⚠️  Error processing event at block ${event.blockNumber}:`, error.message);
      }
    }

    console.log(`✅ Processed ${formattedEvents.length} events\n`);

    // Save to file
    console.log('💾 Saving data to file...');
    const dataDir = path.join(__dirname, '../../data');

    // Ensure data directory exists
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    const outputPath = path.join(__dirname, '../../', DATA_PATHS.RAW_BREVIS_EVENTS);

    const output = {
      metadata: {
        fetchedAt: new Date().toISOString(),
        network: network.name,
        chainId: Number(network.chainId),
        contractAddress: BREVIS_CONFIG.INCENTRA_CONTRACT,
        fromBlock,
        toBlock,
        totalEvents: formattedEvents.length,
      },
      events: formattedEvents,
    };

    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`✅ Data saved to: ${outputPath}\n`);

    // Summary
    console.log('📊 Summary:');
    console.log(`   Total Events: ${formattedEvents.length}`);
    console.log(`   Unique Users: ${new Set(formattedEvents.map(e => e.user)).size}`);
    console.log(`   Block Range: ${fromBlock.toLocaleString()} - ${toBlock.toLocaleString()}`);
    console.log(`   Time Range: ${formattedEvents[0]?.timestampDate || 'N/A'} to ${formattedEvents[formattedEvents.length - 1]?.timestampDate || 'N/A'}`);
    console.log('\n✨ Brevis data fetch complete!\n');

  } catch (error) {
    console.error('\n❌ Fatal error during data fetch:', error);
    process.exit(1);
  }
}

// Run the script
fetchBrevisData();
