export interface Position {
    id: string;
    owner: string;
    tokenA: string;
    tokenB: string;
    lowerBinId: number;
    upperBinId: number;
    liquidity: number;
    totalValue: number;
    feesEarned: {
        tokenA: number;
        tokenB: number;
    };
    createdAt: number;
    lastUpdated: number;
}

export interface PositionStats {
    impermanentLoss: number;
    dailyVolume: number;
    dailyFees: number;
    apy: number;
    utilizationRate: number;
    healthScore: number;
}

export interface RebalanceStrategy {
    type: 'PASSIVE' | 'ACTIVE' | 'DYNAMIC';
    targetRatio: number;
    rebalanceThreshold: number;
    maxSlippage: number;
    minInterval: number;
}

export interface OrderType {
    type: 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
    price: number;
    size: number;
    expiry?: number;
}

export interface PositionRisk {
    concentration: number;
    volatility: number;
    correlation: number;
    liquidityDepth: number;
    impermanentLossRisk: number;
}