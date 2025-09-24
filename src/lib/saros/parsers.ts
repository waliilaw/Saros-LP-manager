import * as BufferLayout from '@solana/buffer-layout';
import { PublicKey } from '@solana/web3.js';
import {  IDLMMPosition } from './interfaces';
import { POOL_LAYOUT, POSITION_LAYOUT } from './layouts';

export const parsePubkey = (data: Uint8Array): PublicKey => {
    return new PublicKey(data);
};

export const parsePool = (data: Uint8Array | null, address: PublicKey): any => {
    // For development, return mock data if no data is provided
    if (!data) {
        return {
            address,
            tokenX: new PublicKey('11111111111111111111111111111111'),
            tokenY: new PublicKey('11111111111111111111111111111111'),
            reserveX: BigInt(1000000),
            reserveY: BigInt(1000000),
            activeId: 1000,
            binStep: 100,
            totalLiquidity: BigInt(2000000),
            feeProtocol: 30,
            feesX: BigInt(5000),
            feesY: BigInt(5000)
        };
    }

    const poolData = POOL_LAYOUT.decode(data);
    
    return {
        address,
        tokenX: parsePubkey(poolData.tokenX),
        tokenY: parsePubkey(poolData.tokenY),
        reserveX: BigInt(poolData.reserveX.toString()),
        reserveY: BigInt(poolData.reserveY.toString()),
        activeId: poolData.activeId,
        binStep: poolData.binStep,
        totalLiquidity: BigInt(poolData.totalLiquidity.toString()),
        feeProtocol: poolData.feeProtocol,
        feesX: BigInt(poolData.feesX.toString()),
        feesY: BigInt(poolData.feesY.toString())
    };
};

export const parsePosition = (data: Uint8Array | null, address: PublicKey): any => {
    // For development, return mock data if no data is provided
    if (!data) {
        return {
            address,
            owner: new PublicKey('11111111111111111111111111111111'),
            pool: new PublicKey('11111111111111111111111111111111'),
            lowerBinId: 1000,
            upperBinId: 2000,
            tokenXDeposited: BigInt(1000000),
            tokenYDeposited: BigInt(1000000),
            feesEarnedX: BigInt(5000),
            feesEarnedY: BigInt(5000),
            lastUpdatedAt: Date.now(),
            liquidityShares: [BigInt(1000)],
            healthFactor: 85
        };
    }

    const posData = POSITION_LAYOUT.decode(data);
    
    return {
        address,
        owner: parsePubkey(posData.owner),
        pool: parsePubkey(posData.pool),
        lowerBinId: posData.lowerBinId,
        upperBinId: posData.upperBinId,
        tokenXDeposited: BigInt(posData.tokenXDeposited.toString()),
        tokenYDeposited: BigInt(posData.tokenYDeposited.toString()),
        feesEarnedX: BigInt(posData.feesEarnedX.toString()),
        feesEarnedY: BigInt(posData.feesEarnedY.toString()),
        lastUpdatedAt: posData.lastUpdatedAt,
        liquidityShares: [], // Will be populated from separate bin data
        healthFactor: 0 // Will be calculated based on current market conditions
    };
};