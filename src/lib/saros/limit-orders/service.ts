import { Connection, PublicKey } from '@solana/web3.js';
import { LiquidityBookServices, MODE } from '@saros-finance/dlmm-sdk';
import { Transaction } from '@saros-finance/dlmm-sdk/node_modules/@solana/web3.js';
import { SOLANA_RPC_ENDPOINT } from '../config';

interface PoolMetadata {
  binStep: number;
  activeId: number;
  volume24h?: number;
  priceChange24h?: number;
  [key: string]: any;
}

interface Bin {
  liquidity: number;
  amountX: number;
  amountY: number;
  volume24h?: number;
  fees?: number;
  [key: string]: any;
}

export interface LimitOrderParams {
  poolAddress: string;
  tokenA: string;
  tokenB: string;
  amount: number;
  targetPrice: number;
  isTokenA: boolean;
  isBuy: boolean;
  payer: string;
  signAndSendTransaction: (tx: Transaction) => Promise<string>;
}

export interface LimitOrder {
  id: string;
  poolAddress: string;
  tokenA: string;
  tokenB: string;
  amount: number;
  targetPrice: number;
  isTokenA: boolean;
  isBuy: boolean;
  binId: number;
  status: 'pending' | 'filled' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export class LimitOrderService {
  private lb: LiquidityBookServices;
  private connection: Connection;

  constructor() {
    this.connection = new Connection(SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com');
    this.lb = new LiquidityBookServices({
      mode: MODE.DEVNET,
      options: { 
        rpcUrl: SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com'
      },
    });
  }

  async createLimitOrder(params: LimitOrderParams): Promise<LimitOrder> {
    try {
      // Get pool metadata to understand bin configuration
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(params.poolAddress);
      if (!rawPoolMetadata) {
        throw new Error('Could not fetch pool metadata');
      }

      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;
      const binStep = poolMetadata.binStep || 0;
      const activeId = poolMetadata.activeId || 0;

      // Calculate target bin ID based on target price
      const targetBinId = Math.floor(
        Math.log(params.targetPrice) / Math.log(1 + binStep)
      );

      // Create a new position at the target bin
      const { Keypair } = await import('@solana/web3.js');
      const positionMint = Keypair.generate();
      const transaction = new Transaction();

      // Add liquidity to a single bin at the target price
      await this.lb.createPosition({
        payer: new PublicKey(params.payer),
        relativeBinIdLeft: targetBinId,
        relativeBinIdRight: targetBinId, // Same as left for single bin
        pair: new PublicKey(params.poolAddress),
        binArrayIndex: Math.floor(targetBinId / 4096),
        positionMint: positionMint.publicKey,
        transaction,
      });

      // Add liquidity to the position
      await this.lb.addLiquidityIntoPosition({
        positionMint: positionMint.publicKey,
        payer: new PublicKey(params.payer),
        pair: new PublicKey(params.poolAddress),
        transaction,
        liquidityDistribution: [{
          relativeBinId: targetBinId - activeId,
          distributionX: params.isTokenA ? params.amount : 0,
          distributionY: params.isTokenA ? 0 : params.amount,
        }],
        amountX: params.isTokenA ? params.amount : 0,
        amountY: params.isTokenA ? 0 : params.amount,
        binArrayLower: new PublicKey(Math.floor(targetBinId / 4096).toString()),
        binArrayUpper: new PublicKey(Math.floor(targetBinId / 4096).toString()),
      });

      // Prepare and send transaction
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = new PublicKey(params.payer);

      transaction.partialSign(positionMint);
      const signature = await params.signAndSendTransaction(transaction);

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      // Create and return limit order object
      const order: LimitOrder = {
        id: positionMint.publicKey.toString(),
        poolAddress: params.poolAddress,
        tokenA: params.tokenA,
        tokenB: params.tokenB,
        amount: params.amount,
        targetPrice: params.targetPrice,
        isTokenA: params.isTokenA,
        isBuy: params.isBuy,
        binId: targetBinId,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return order;
    } catch (error) {
      console.error('Failed to create limit order:', error);
      throw new Error(`Failed to create limit order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelLimitOrder(params: {
    orderId: string;
    payer: string;
    signAndSendTransaction: (tx: Transaction) => Promise<string>;
  }): Promise<boolean> {
    try {
      // Get position data
      const positions = await this.lb.getUserPositions({
        payer: new PublicKey(params.payer),
        pair: new PublicKey(params.orderId), // We'll get all positions and filter
      });
      if (!positions) {
        throw new Error('Failed to fetch positions');
      }

      const position = positions.find(p => p.address.toString() === params.orderId);
      if (!position) {
        throw new Error('Position not found');
      }

      // Get pool metadata
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(position.pair.toString());
      if (!rawPoolMetadata) {
        throw new Error('Pool metadata not found');
      }

      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;
      const transaction = new Transaction();

      // Remove all liquidity from the position
      const result = await this.lb.removeMultipleLiquidity({
        maxPositionList: [{
          position: position.address.toString(),
          start: position.lowerBinId,
          end: position.upperBinId,
          positionMint: params.orderId,
        }],
        payer: new PublicKey(params.payer),
        type: "removeBoth",
        pair: position.pair,
        tokenMintX: position.tokenX,
        tokenMintY: position.tokenY,
        activeId: poolMetadata.activeId || 0,
      });

      // Add instructions to transaction
      if (result.txs?.length) {
        for (const tx of result.txs) {
          transaction.add(...tx.instructions);
        }
      }

      // Prepare and send transaction
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = new PublicKey(params.payer);

      const signature = await params.signAndSendTransaction(transaction);

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to cancel limit order:', error);
      throw new Error(`Failed to cancel limit order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLimitOrder(orderId: string): Promise<LimitOrder | null> {
    try {
      // We'll get all positions and filter for the one we want
      const positions = await this.lb.getUserPositions({
        payer: new PublicKey(orderId), // This is not ideal, but we don't have the payer address
        pair: new PublicKey(orderId), // This is not ideal, but we don't have the pool address
      });
      if (!positions) return null;

      const position = positions.find(p => p.address.toString() === orderId);
      if (!position) return null;

      const rawPoolMetadata = await this.lb.fetchPoolMetadata(position.pair.toString());
      if (!rawPoolMetadata) return null;

      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;
      const binStep = poolMetadata.binStep || 0;
      const binId = position.lowerBinId;
      const price = Math.pow(1 + binStep, binId);

      return {
        id: orderId,
        poolAddress: position.pair.toString(),
        tokenA: position.tokenX.toString(),
        tokenB: position.tokenY.toString(),
        amount: position.liquidity,
        targetPrice: price,
        isTokenA: position.amountX > 0,
        isBuy: position.lowerBinId > poolMetadata.activeId,
        binId,
        status: position.liquidity > 0 ? 'pending' : 'filled',
        createdAt: position.createdAt,
        updatedAt: position.lastUpdateTime,
      };
    } catch (error) {
      console.error('Failed to get limit order:', error);
      return null;
    }
  }

  async getUserLimitOrders(params: { payer: string; poolAddress: string }): Promise<LimitOrder[]> {
    try {
      const positions = await this.lb.getUserPositions({
        payer: new PublicKey(params.payer),
        pair: new PublicKey(params.poolAddress),
      });

      if (!positions) return [];

      const rawPoolMetadata = await this.lb.fetchPoolMetadata(params.poolAddress);
      if (!rawPoolMetadata) return [];

      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;
      const binStep = poolMetadata.binStep || 0;
      const activeId = poolMetadata.activeId || 0;

      return positions
        .filter(pos => pos.lowerBinId === pos.upperBinId) // Only single-bin positions are limit orders
        .map(pos => ({
          id: pos.address.toString(),
          poolAddress: params.poolAddress,
          tokenA: pos.tokenX.toString(),
          tokenB: pos.tokenY.toString(),
          amount: pos.liquidity,
          targetPrice: Math.pow(1 + binStep, pos.lowerBinId),
          isTokenA: pos.amountX > 0,
          isBuy: pos.lowerBinId > activeId,
          binId: pos.lowerBinId,
          status: pos.liquidity > 0 ? 'pending' : 'filled',
          createdAt: pos.createdAt,
          updatedAt: pos.lastUpdateTime,
        }));
    } catch (error) {
      console.error('Failed to get user limit orders:', error);
      return [];
    }
  }
}
