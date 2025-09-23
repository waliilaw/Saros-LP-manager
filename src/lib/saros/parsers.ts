import * as BufferLayout from '@solana/buffer-layout';
import { PublicKey } from '@solana/web3.js';
import { IDLMMPool, IDLMMPosition } from './interfaces';
import { POOL_LAYOUT, POSITION_LAYOUT } from './layouts';

export const parsePubkey = (data: Uint8Array): PublicKey => {
    return new PublicKey(data);
};

export const parsePool = (data: Uint8Array, address: PublicKey): IDLMMPool => {
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

export const parsePosition = (data: Uint8Array, address: PublicKey): IDLMMPosition => {
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