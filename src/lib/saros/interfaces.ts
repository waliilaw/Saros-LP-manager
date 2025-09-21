import { PublicKey } from '@solana/web3.js';

export interface IDLMMConfig {
    binStep: number;
    baseFee: number;
    protocolShare: number;
    maxBinId: number;
    minBinId: number;
}

export interface IDLMMPool {
    address: PublicKey;
    tokenX: PublicKey;
    tokenY: PublicKey;
    reserveX: bigint;
    reserveY: bigint;
    activeId: number;
    binStep: number;
    totalLiquidity: bigint;
    feeProtocol: number;
    feesX: bigint;
    feesY: bigint;
}

export interface IDLMMPosition {
    address: PublicKey;
    owner: PublicKey;
    pool: PublicKey;
    lowerBinId: number;
    upperBinId: number;
    liquidityShares: bigint[];
    tokenXDeposited: bigint;
    tokenYDeposited: bigint;
    feesEarnedX: bigint;
    feesEarnedY: bigint;
    lastUpdatedAt: number;
    healthFactor: number;
}

export interface IDLMMBin {
    id: number;
    reserveX: bigint;
    reserveY: bigint;
    price: number;
    liquidityTotal: bigint;
    supplyShares: bigint;
}

export interface IPositionMetrics {
    impermanentLoss: number;
    totalValueLocked: number;
    apr: number;
    volumeLast24h: number;
    feesLast24h: number;
    binUtilization: number;
    priceRange: {
        min: number;
        max: number;
        current: number;
    };
}

export interface IPoolSnapshot {
    timestamp: number;
    priceX: number;
    priceY: number;
    volumeX: bigint;
    volumeY: bigint;
    tvl: number;
    apr: number;
}