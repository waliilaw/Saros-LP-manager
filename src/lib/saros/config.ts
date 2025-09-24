// Network Configuration
export const SOLANA_NETWORK = 'devnet' as const;
export const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// Saros DLMM Configuration
export const SAROS_PROGRAM_ID = '1qbkdrr3z4ryLA7pZykqxvxWPoeifcVKo6ZG9CfkvVE';

// Pool Configuration
export const DEFAULT_BIN_STEP = 100; // Price change % between bins
export const MIN_BIN_ID = 0;
export const MAX_BIN_ID = 800000;

// Risk Management Constants
export const DEFAULT_SLIPPAGE_TOLERANCE = 0.5; // 0.5%
export const MIN_POSITION_SIZE = 0.1; // Minimum position size in base token
export const MAX_POSITION_SIZE = 1000000; // Maximum position size in base token

// Rebalancing Constants
export const REBALANCE_THRESHOLD = 5; // 5% price deviation trigger
export const MIN_REBALANCE_INTERVAL = 3600; // 1 hour in seconds

// API Configuration
export const API_RATE_LIMIT = 100; // Requests per minute
export const API_RATE_WINDOW = 60; // Window in seconds

// Development Settings
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const ENABLE_LOGGING = IS_DEVELOPMENT;