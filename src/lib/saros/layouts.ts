import { BufferLayout } from '@solana/buffer-layout';
import { PublicKey } from '@solana/web3.js';

export const POOL_LAYOUT = BufferLayout.struct([
    BufferLayout.u8('version'),
    BufferLayout.u8('isInitialized'),
    BufferLayout.ns64('reserveX'),
    BufferLayout.ns64('reserveY'),
    BufferLayout.u32('activeId'),
    BufferLayout.u32('binStep'),
    BufferLayout.ns64('totalLiquidity'),
    BufferLayout.u8('feeProtocol'),
    BufferLayout.ns64('feesX'),
    BufferLayout.ns64('feesY'),
    BufferLayout.blob(32, 'tokenX'),
    BufferLayout.blob(32, 'tokenY')
]);

export const POSITION_LAYOUT = BufferLayout.struct([
    BufferLayout.u8('version'),
    BufferLayout.u8('isInitialized'),
    BufferLayout.u32('lowerBinId'),
    BufferLayout.u32('upperBinId'),
    BufferLayout.ns64('tokenXDeposited'),
    BufferLayout.ns64('tokenYDeposited'),
    BufferLayout.ns64('feesEarnedX'),
    BufferLayout.ns64('feesEarnedY'),
    BufferLayout.u32('lastUpdatedAt'),
    BufferLayout.blob(32, 'owner'),
    BufferLayout.blob(32, 'pool')
]);