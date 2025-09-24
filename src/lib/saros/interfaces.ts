import { PublicKey } from '@solana/web3.js';

export interface IDLMMPosition {
    address: PublicKey;
    pool: PublicKey;
    owner: PublicKey;
    liquidity: number;
    lowerBinId: number;
    upperBinId: number;
    lastUpdateTime: number;
    healthFactor: number;
}

export interface IPositionMetrics {
    feesEarned: number;
    volume24h: number;
    apr: number;
    impermanentLoss: number;
    priceRange: {
        lower: number;
        upper: number;
    };
    utilization: number;
    healthScore: number;
}

export interface TimeSeriesData {
    timestamp: number;
    value: number;
}