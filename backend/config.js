import dotenv from 'dotenv';
dotenv.config();

// Primary Data Source: PancakeSwap V3 Analytics
// This dashboard focuses on PancakeSwap V3 trading analytics on BSC
// Tracking swap activity, trading volume, and user engagement
//
// Future Enhancement: Brevis Incentra Integration
// NOTE: Brevis Incentra campaigns track activity on Base but rewards are claimed on Optimism.
// Contract addresses are not publicly documented. Can be added when available.
// Sources: https://blockchainreporter.net/pancakeswap-and-brevis-expand-partnership-with-zk-verified-lp-incentives-on-base
export const BREVIS_CONFIG = {
  // Reserved for future Brevis Incentra integration
  ENABLED: false,
  INCENTRA_CONTRACT: '0x0000000000000000000000000000000000000000',
  BASE_CHAIN_ID: 8453,
  OPTIMISM_CHAIN_ID: 10,
};

// PancakeSwap V3 Configuration
export const PANCAKESWAP_CONFIG = {
  // BSC Network (Chain ID: 56)
  BSC_CHAIN_ID: 56,

  // PancakeSwap V3 Pool Addresses on BSC
  POOLS: {
    // USDT-USDC Pool (0.01% fee tier) - $29.77M liquidity
    // Source: https://www.geckoterminal.com/bsc/pools/0x92b7807bf19b7dddf89b706143896d05228f3121
    USDT_USDC: '0x92b7807bf19b7dddf89b706143896d05228f3121',

    // Additional pool for Base network
    // USDT-USDC on Base - $415K liquidity
    // Source: https://www.geckoterminal.com/base/pools/0x5f07bb9fee6062e9d09a52e6d587c64bad6ba706
    USDT_USDC_BASE: '0x5f07bb9fee6062e9d09a52e6d587c64bad6ba706',
  },

  // PancakeSwap V3 Factory on BSC
  FACTORY: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
};

// RPC Endpoints Configuration
export const RPC_CONFIG = {
  // Base Mainnet RPC
  BASE: process.env.BASE_RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,

  // BSC Mainnet RPC (Alchemy endpoint for better rate limits)
  BSC: process.env.BSC_RPC_URL || 'https://bnb-mainnet.g.alchemy.com/v2/gHhvFpUeWj8qEYop9aGH1',

  // Ethereum Mainnet RPC (optional, for future use)
  ETH: process.env.ETH_RPC_URL || `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
};

// Block Range Configuration
export const BLOCK_CONFIG = {
  // Number of blocks to query from current block
  // Base: ~2 sec per block, 100k blocks ≈ 2.3 days
  BREVIS_BLOCK_RANGE: 50000,

  // BSC: ~3 sec per block, 100k blocks ≈ 3.5 days
  PANCAKE_BLOCK_RANGE: 100000,

  // Rate limiting (requests per second)
  RATE_LIMIT_RPS: 1,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
};

// Contract ABIs
export const ABIS = {
  // Brevis Incentra RewardClaimed event ABI
  BREVIS_INCENTRA: [
    'event RewardClaimed(address indexed user, uint256 amount, uint256 timestamp)'
  ],

  // PancakeSwap V3 Pool Swap event ABI
  PANCAKESWAP_V3_POOL: [
    'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'
  ],
};

// Data Storage Paths (relative to project root)
export const DATA_PATHS = {
  RAW_BREVIS_EVENTS: '../data/raw-events.json',
  PANCAKESWAP_SWAPS: '../data/pancakeswap-swaps.json',
  ANALYTICS: '../data/analytics.json',
};

// Export default config object
export default {
  BREVIS_CONFIG,
  PANCAKESWAP_CONFIG,
  RPC_CONFIG,
  BLOCK_CONFIG,
  ABIS,
  DATA_PATHS,
};
