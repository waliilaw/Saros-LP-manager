import { Connection, clusterApiUrl } from '@solana/web3.js';

export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
export const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || clusterApiUrl(SOLANA_NETWORK);

export const connection = new Connection(SOLANA_RPC_ENDPOINT);

// Saros DLMM Constants
export const SAROS_PROGRAM_ID = process.env.NEXT_PUBLIC_SAROS_PROGRAM_ID;

// Position Management Constants
export const DEFAULT_BIN_STEP = 100; // Will need to be adjusted based on Saros documentation
export const MIN_BIN_ID = 0;
export const MAX_BIN_ID = 800000;

// Risk Management Constants
export const DEFAULT_SLIPPAGE_TOLERANCE = 0.5; // 0.5%
export const MIN_POSITION_SIZE = 0.1; // Minimum position size in base token
export const MAX_POSITION_SIZE = 1000000; // Maximum position size in base token

// Rebalancing Constants
export const REBALANCE_THRESHOLD = 5; // 5% price deviation trigger
export const MIN_REBALANCE_INTERVAL = 3600; // 1 hour in seconds