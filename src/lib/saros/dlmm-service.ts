import { Connection, PublicKey } from '@solana/web3.js';
import { DLMM, DLMMPool, DLMMPosition, BinArray } from '@saros-finance/dlmm-sdk';
import { SOLANA_NETWORK, SOLANA_RPC_ENDPOINT, SAROS_PROGRAM_ID } from './config';

export class SarosDLMMService {
  private dlmm: DLMM;
  private programId: PublicKey;

  constructor(private connection: Connection) {
    if (!SAROS_PROGRAM_ID) {
      throw new Error('SAROS_PROGRAM_ID is not configured');
    }
    this.programId = new PublicKey(SAROS_PROGRAM_ID);
    this.dlmm = new DLMM(
      this.connection,
      this.programId
    );
  }

  async createPosition(params: {
    tokenA: string;
    tokenB: string;
    lowerBinId: number;
    upperBinId: number;
    amount: number;
    isTokenA: boolean;
  }): Promise<DLMMPosition> {
    try {
      // Get pool for token pair
      const pool = await this.getPoolForTokens(params.tokenA, params.tokenB);
      if (!pool) {
        throw new Error('Pool not found for token pair');
      }

      // Create position transaction
      const tx = await this.dlmm.createPosition({
        pool,
        lowerBinId: params.lowerBinId,
        upperBinId: params.upperBinId,
        amount: params.amount,
        isTokenA: params.isTokenA,
      });

      // Send and confirm transaction
      const signature = await this.connection.sendTransaction(tx);
      await this.connection.confirmTransaction(signature);

      // Get the new position
      const positions = await this.dlmm.getPositions(pool);
      return positions[positions.length - 1];

    } catch (error) {
      console.error('Failed to create position:', error);
      throw error;
    }
  }

  async adjustPosition(params: {
    position: DLMMPosition;
    newLowerBinId?: number;
    newUpperBinId?: number;
    addAmount?: number;
    removeAmount?: number;
  }): Promise<boolean> {
    try {
      let tx;

      if (params.addAmount) {
        // Add liquidity
        tx = await this.dlmm.addLiquidity({
          position: params.position,
          amount: params.addAmount,
        });
      } else if (params.removeAmount) {
        // Remove liquidity
        tx = await this.dlmm.removeLiquidity({
          position: params.position,
          amount: params.removeAmount,
        });
      } else if (params.newLowerBinId !== undefined && params.newUpperBinId !== undefined) {
        // Adjust range
        tx = await this.dlmm.adjustRange({
          position: params.position,
          newLowerBinId: params.newLowerBinId,
          newUpperBinId: params.newUpperBinId,
        });
      } else {
        throw new Error('Invalid adjustment parameters');
      }

      // Send and confirm transaction
      const signature = await this.connection.sendTransaction(tx);
      await this.connection.confirmTransaction(signature);

      return true;
    } catch (error) {
      console.error('Failed to adjust position:', error);
      throw error;
    }
  }

  async getPosition(positionId: string): Promise<DLMMPosition | null> {
    try {
      const positionPubkey = new PublicKey(positionId);
      return await this.dlmm.getPosition(positionPubkey);
    } catch (error) {
      console.error('Failed to get position:', error);
      throw error;
    }
  }

  async getPool(poolId: string): Promise<DLMMPool | null> {
    try {
      const poolPubkey = new PublicKey(poolId);
      return await this.dlmm.getPool(poolPubkey);
    } catch (error) {
      console.error('Failed to get pool:', error);
      throw error;
    }
  }

  async getUserPositions(): Promise<DLMMPosition[]> {
    try {
      // Get all pools
      const pools = await this.dlmm.getPools();
      
      // Get positions for each pool
      const positionsPromises = pools.map(pool => this.dlmm.getPositions(pool));
      const positionsArrays = await Promise.all(positionsPromises);
      
      // Flatten and filter positions
      return positionsArrays.flat();
    } catch (error) {
      console.error('Failed to get user positions:', error);
      throw error;
    }
  }

  private async getPoolForTokens(tokenA: string, tokenB: string): Promise<DLMMPool | null> {
    try {
      const pools = await this.dlmm.getPools();
      return pools.find(pool => 
        (pool.tokenA.toString() === tokenA && pool.tokenB.toString() === tokenB) ||
        (pool.tokenA.toString() === tokenB && pool.tokenB.toString() === tokenA)
      ) || null;
    } catch (error) {
      console.error('Failed to get pool for tokens:', error);
      throw error;
    }
  }

  async getBinPrices(pool: DLMMPool): Promise<BinArray> {
    try {
      return await this.dlmm.getBinPrices(pool);
    } catch (error) {
      console.error('Failed to get bin prices:', error);
      throw error;
    }
  }

  async getPositionValue(position: DLMMPosition): Promise<{
    valueA: number;
    valueB: number;
    totalValue: number;
  }> {
    try {
      const pool = await this.getPool(position.pool.toString());
      if (!pool) throw new Error('Pool not found');

      const binPrices = await this.getBinPrices(pool);
      
      // Calculate position value using bin prices
      let valueA = 0;
      let valueB = 0;

      for (let binId = position.lowerBinId; binId <= position.upperBinId; binId++) {
        const binLiquidity = position.liquidityPerBin[binId] || 0;
        const binPrice = binPrices[binId] || 0;

        valueA += binLiquidity * (1 / binPrice);
        valueB += binLiquidity * binPrice;
      }

      const totalValue = valueA + valueB;

      return { valueA, valueB, totalValue };
    } catch (error) {
      console.error('Failed to get position value:', error);
      throw error;
    }
  }
}