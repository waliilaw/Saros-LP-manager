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

export interface RebalanceStrategy {
  type: 'symmetric' | 'dynamic' | 'concentrated';
  targetUtilization: number;
  rebalanceThreshold: number;
  minBinSpread: number;
  maxBinSpread: number;
  concentrationFactor?: number;
}

export interface RebalanceParams {
  poolAddress: string;
  positionId: string;
  strategy: RebalanceStrategy;
  payer: string;
  signAndSendTransaction: (tx: Transaction) => Promise<string>;
}

export interface RebalanceResult {
  success: boolean;
  newLowerBinId: number;
  newUpperBinId: number;
  signature?: string;
  error?: string;
}

export class RebalancingService {
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

  async checkRebalanceNeeded(params: {
    poolAddress: string;
    positionId: string;
    strategy: RebalanceStrategy;
  }): Promise<{
    needed: boolean;
    reason?: string;
    suggestedBins?: { lower: number; upper: number };
  }> {
    try {
      // Get pool metadata and position info
      // Get pool metadata
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(params.poolAddress);
      if (!rawPoolMetadata) {
        throw new Error('Failed to fetch pool metadata');
      }
      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;

      // Get position data
      const positions = await this.lb.getUserPositions({
        payer: new PublicKey(params.positionId), // This is not ideal, but we don't have the payer address
        pair: new PublicKey(params.poolAddress),
      });
      if (!positions) {
        throw new Error('Failed to fetch positions');
      }

      const position = positions.find(p => p.address.toString() === params.positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      // We already checked both poolMetadata and position

      const activeId = poolMetadata.activeId || 0;
      const binStep = poolMetadata.binStep || 0;

      // Calculate current position metrics
      const currentSpread = position.upperBinId - position.lowerBinId;
      const currentCenter = Math.floor((position.upperBinId + position.lowerBinId) / 2);
      const deviation = Math.abs(currentCenter - activeId);

      // Check if rebalance is needed based on strategy
      switch (params.strategy.type) {
        case 'symmetric': {
          // Symmetric strategy maintains equal distance from active bin
          const targetSpread = Math.min(
            Math.max(
              Math.floor(1 / binStep), // Minimum spread
              params.strategy.minBinSpread
            ),
            params.strategy.maxBinSpread
          );

          if (deviation > params.strategy.rebalanceThreshold || currentSpread !== targetSpread) {
            return {
              needed: true,
              reason: 'Position center deviated from active bin or spread needs adjustment',
              suggestedBins: {
                lower: activeId - Math.floor(targetSpread / 2),
                upper: activeId + Math.floor(targetSpread / 2),
              },
            };
          }
          break;
        }

        case 'dynamic': {
          // Dynamic strategy adjusts spread based on volatility
          const volatility = await this.calculateVolatility(params.poolAddress);
          const targetSpread = Math.min(
            Math.max(
              Math.floor(volatility * 100), // Scale volatility to bin count
              params.strategy.minBinSpread
            ),
            params.strategy.maxBinSpread
          );

          if (deviation > params.strategy.rebalanceThreshold || Math.abs(currentSpread - targetSpread) > 2) {
            return {
              needed: true,
              reason: 'Position needs adjustment based on market volatility',
              suggestedBins: {
                lower: activeId - Math.floor(targetSpread / 2),
                upper: activeId + Math.floor(targetSpread / 2),
              },
            };
          }
          break;
        }

        case 'concentrated': {
          // Concentrated strategy focuses liquidity near active bin
          const concentrationFactor = params.strategy.concentrationFactor || 2;
          const targetSpread = Math.min(
            Math.max(
              Math.floor(1 / (binStep * concentrationFactor)),
              params.strategy.minBinSpread
            ),
            params.strategy.maxBinSpread
          );

          if (deviation > params.strategy.rebalanceThreshold || currentSpread !== targetSpread) {
            return {
              needed: true,
              reason: 'Position needs to be concentrated closer to active bin',
              suggestedBins: {
                lower: activeId - Math.floor(targetSpread / 3), // Asymmetric spread
                upper: activeId + Math.floor(targetSpread * 2 / 3),
              },
            };
          }
          break;
        }
      }

      return { needed: false };
    } catch (error) {
      console.error('Failed to check rebalance:', error);
      throw error;
    }
  }

  private async calculateVolatility(poolAddress: string): Promise<number> {
    try {
      // Get pool metadata
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(poolAddress);
      if (!rawPoolMetadata) return 0.01; // Default low volatility

      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;
      const binStep = poolMetadata.binStep || 0;
      const activeId = poolMetadata.activeId || 0;

      // Get bins around active ID to calculate volatility
      const binRange = 10; // Look at 10 bins on each side
      const bins = await Promise.all(
        Array.from({ length: binRange * 2 + 1 }, (_, i) => activeId - binRange + i)
          .map(binId => (this.lb as any).fetchBin(poolAddress, binId) as Promise<Bin>)
      );

      // Calculate price volatility using bin liquidity distribution
      const validBins = bins.filter((bin): bin is Bin => bin !== null);
      const prices = validBins.map((_, i) => Math.pow(1 + binStep, activeId - binRange + i));
      const weights = validBins.map(bin => bin.liquidity || 0);
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      if (totalWeight === 0) return 0.01; // Default low volatility

      // Calculate weighted mean
      const weightedMean = prices.reduce((sum, price, i) => sum + price * weights[i], 0) / totalWeight;

      // Calculate weighted variance
      const weightedVariance = prices.reduce((sum, price, i) => {
        const deviation = price - weightedMean;
        return sum + weights[i] * deviation * deviation;
      }, 0) / totalWeight;

      const weightedStdDev = Math.sqrt(weightedVariance);
      return weightedStdDev / weightedMean; // Return relative volatility
    } catch (error) {
      console.error('Failed to calculate volatility:', error);
      return 0.01; // Default to low volatility on error
    }
  }

  async rebalancePosition(params: RebalanceParams): Promise<RebalanceResult> {
    try {
      // Check if rebalance is needed
      const check = await this.checkRebalanceNeeded({
        poolAddress: params.poolAddress,
        positionId: params.positionId,
        strategy: params.strategy,
      });

      if (!check.needed || !check.suggestedBins) {
        return {
          success: false,
          newLowerBinId: 0,
          newUpperBinId: 0,
          error: 'Rebalance not needed',
        };
      }

      // Get pool metadata
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(params.poolAddress);
      if (!rawPoolMetadata) {
        throw new Error('Failed to fetch pool metadata');
      }
      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;

      // Get position data
      const positions = await this.lb.getUserPositions({
        payer: new PublicKey(params.positionId), // This is not ideal, but we don't have the payer address
        pair: new PublicKey(params.poolAddress),
      });
      if (!positions) {
        throw new Error('Failed to fetch positions');
      }

      const position = positions.find(p => p.address.toString() === params.positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      // Create transaction for rebalancing
      const transaction = new Transaction();

      // Remove liquidity from current bins
      const result = await this.lb.removeMultipleLiquidity({
        maxPositionList: [{
          position: position.address.toString(),
          start: position.lowerBinId,
          end: position.upperBinId,
          positionMint: params.positionId,
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

      // We already have poolMetadata

      const activeId = poolMetadata.activeId || 0;
      const distribution = [];
      for (let i = check.suggestedBins.lower; i <= check.suggestedBins.upper; i++) {
        distribution.push({
          relativeBinId: i - activeId,
          distributionX: 1, // Equal distribution
          distributionY: 1,
        });
      }

      await this.lb.addLiquidityIntoPosition({
        positionMint: new PublicKey(params.positionId),
        payer: new PublicKey(params.payer),
        pair: new PublicKey(params.poolAddress),
        transaction,
        liquidityDistribution: distribution,
        amountX: position.amountX,
        amountY: position.amountY,
        binArrayLower: new PublicKey(Math.floor(check.suggestedBins.lower / 4096).toString()),
        binArrayUpper: new PublicKey(Math.floor(check.suggestedBins.upper / 4096).toString()),
      });

      // Send transaction
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

      return {
        success: true,
        newLowerBinId: check.suggestedBins.lower,
        newUpperBinId: check.suggestedBins.upper,
        signature,
      };
    } catch (error) {
      console.error('Failed to rebalance position:', error);
      return {
        success: false,
        newLowerBinId: 0,
        newUpperBinId: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
