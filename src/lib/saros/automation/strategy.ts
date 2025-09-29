import { PublicKey } from '@solana/web3.js';
import { LiquidityBookServices, MODE } from '@saros-finance/dlmm-sdk';
import { Transaction } from '@saros-finance/dlmm-sdk/node_modules/@solana/web3.js';
import { SOLANA_RPC_ENDPOINT } from '../config';
import { PoolMetadata, Bin, IRebalancingStrategy, PositionState } from './types';

export type { IRebalancingStrategy } from './types';

export class AutomationStrategy implements IRebalancingStrategy {
  private lb: LiquidityBookServices;
  private lastCheck: Map<string, number> = new Map();
  private positionStates: Map<string, PositionState> = new Map();

  // IRebalancingStrategy implementation
  id: string = 'default-strategy';
  name: string = 'Default Rebalancing Strategy';
  description: string = 'Automatically rebalances positions based on market conditions';
  type: 'symmetric' | 'dynamic' | 'concentrated' = 'dynamic';
  targetUtilization: number = 80;
  rebalanceThreshold: number = 3;
  minBinSpread: number = 5;
  maxBinSpread: number = 20;
  concentrationFactor: number = 2;
  minRebalanceInterval: number = 3600000; // 1 hour
  maxGasPrice: number = 100; // 100 lamports
  slippageTolerance: number = 1; // 1%

  constructor() {
    this.lb = new LiquidityBookServices({
      mode: MODE.DEVNET,
      options: { 
        rpcUrl: SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com'
      },
    });
  }

  async checkPosition(
    positionId: string,
    config: IRebalancingStrategy
  ): Promise<{
    needsRebalance: boolean;
    reason?: string;
    suggestedBins?: { lower: number; upper: number };
  }> {
    try {
      // Check rebalance interval
      const lastCheck = this.lastCheck.get(positionId) || 0;
      const minInterval = config.minRebalanceInterval || 3600000; // Default 1 hour
      if (Date.now() - lastCheck < minInterval) {
        return { needsRebalance: false };
      }

      // Get position data
      const positions = await this.lb.getUserPositions({
        payer: new PublicKey(positionId),
        pair: new PublicKey(positionId),
      });
      if (!positions) {
        throw new Error('Failed to fetch positions');
      }

      const position = positions.find(p => p.address.toString() === positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      // Get pool metadata
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(position.pair.toString());
      if (!rawPoolMetadata) {
        throw new Error('Failed to fetch pool metadata');
      }
      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;

      // Calculate current state
      const activeId = poolMetadata.activeId || 0;
      const binStep = poolMetadata.binStep || 0;
      const currentCenter = Math.floor((position.lowerBinId + position.upperBinId) / 2);
      const currentSpread = position.upperBinId - position.lowerBinId;
      const deviation = Math.abs(currentCenter - activeId);

      // Get market volatility
      const volatility = await this.calculateVolatility(position.pair.toString());

      // Calculate target spread based on strategy
      let targetSpread: number;
      let targetCenter: number;

      switch (config.type) {
        case 'symmetric':
          targetSpread = Math.min(
            Math.max(config.minBinSpread, Math.floor(1 / binStep)),
            config.maxBinSpread
          );
          targetCenter = activeId;
          break;

        case 'dynamic':
          targetSpread = Math.min(
            Math.max(
              config.minBinSpread,
              Math.floor(volatility * 100)
            ),
            config.maxBinSpread
          );
          targetCenter = activeId;
          break;

        case 'concentrated':
          const concentrationFactor = config.concentrationFactor || 2;
          targetSpread = Math.min(
            Math.max(
              config.minBinSpread,
              Math.floor(1 / (binStep * concentrationFactor))
            ),
            config.maxBinSpread
          );
          targetCenter = activeId + Math.floor(targetSpread / 3);
          break;

        default:
          throw new Error('Invalid strategy type');
      }

      // Check if rebalance is needed
      const needsRebalance = 
        deviation > config.rebalanceThreshold || 
        Math.abs(currentSpread - targetSpread) > 2;

      if (needsRebalance) {
        const suggestedLower = targetCenter - Math.floor(targetSpread / 2);
        const suggestedUpper = targetCenter + Math.floor(targetSpread / 2);

        return {
          needsRebalance: true,
          reason: deviation > config.rebalanceThreshold
            ? 'Position deviated from active bin'
            : 'Spread adjustment needed',
          suggestedBins: {
            lower: suggestedLower,
            upper: suggestedUpper,
          },
        };
      }

      return { needsRebalance: false };
    } catch (error) {
      console.error('Failed to check position:', error);
      throw error;
    }
  }

  private async calculateVolatility(poolAddress: string): Promise<number> {
    try {
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(poolAddress);
      if (!rawPoolMetadata) return 0.01;

      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;
      const binStep = poolMetadata.binStep || 0;
      const activeId = poolMetadata.activeId || 0;

      const binRange = 10;
      const bins = await Promise.all(
        Array.from({ length: binRange * 2 + 1 }, (_, i) => activeId - binRange + i)
          .map(binId => (this.lb as any).fetchBin(poolAddress, binId) as Promise<Bin>)
      );

      const validBins = bins.filter((bin): bin is Bin => bin !== null);
      const prices = validBins.map((_, i) => Math.pow(1 + binStep, activeId - binRange + i));
      const weights = validBins.map(bin => bin.liquidity || 0);
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      if (totalWeight === 0) return 0.01;

      const weightedMean = prices.reduce((sum, price, i) => sum + price * weights[i], 0) / totalWeight;
      const weightedVariance = prices.reduce((sum, price, i) => {
        const deviation = price - weightedMean;
        return sum + weights[i] * deviation * deviation;
      }, 0) / totalWeight;

      const weightedStdDev = Math.sqrt(weightedVariance);
      return weightedStdDev / weightedMean;
    } catch (error) {
      console.error('Failed to calculate volatility:', error);
      return 0.01;
    }
  }

  async checkAndExecute(position: any, metrics: any): Promise<void> {
    try {
      const check = await this.checkPosition(position.id, this);
      if (check.needsRebalance) {
        await this.executeRebalance(position.id, this, position.signAndSendTransaction);
      }
    } catch (error) {
      console.error('Failed to check and execute rebalance:', error);
    }
  }

  async executeRebalance(
    positionId: string,
    config: IRebalancingStrategy,
    signAndSendTransaction: (tx: Transaction) => Promise<string>
  ): Promise<{
    success: boolean;
    signature?: string;
    error?: string;
  }> {
    try {
      const check = await this.checkPosition(positionId, config);
      if (!check.needsRebalance || !check.suggestedBins) {
        return {
          success: false,
          error: 'Rebalance not needed',
        };
      }

      const positions = await this.lb.getUserPositions({
        payer: new PublicKey(positionId),
        pair: new PublicKey(positionId),
      });
      if (!positions) {
        throw new Error('Failed to fetch positions');
      }

      const position = positions.find(p => p.address.toString() === positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      const transaction = new Transaction();

      const result = await this.lb.removeMultipleLiquidity({
        maxPositionList: [{
          position: position.address.toString(),
          start: position.lowerBinId,
          end: position.upperBinId,
          positionMint: positionId,
        }],
        payer: new PublicKey(positionId),
        type: "removeBoth",
        pair: position.pair,
        tokenMintX: position.tokenX,
        tokenMintY: position.tokenY,
        activeId: check.suggestedBins.lower,
      });

      if (result.txs?.length) {
        for (const tx of result.txs) {
          transaction.add(...tx.instructions);
        }
      }

      const distribution = [];
      for (let i = check.suggestedBins.lower; i <= check.suggestedBins.upper; i++) {
        distribution.push({
          relativeBinId: i - check.suggestedBins.lower,
          distributionX: 1,
          distributionY: 1,
        });
      }

      await this.lb.addLiquidityIntoPosition({
        positionMint: new PublicKey(positionId),
        payer: new PublicKey(positionId),
        pair: position.pair,
        transaction,
        liquidityDistribution: distribution,
        amountX: position.amountX,
        amountY: position.amountY,
        binArrayLower: new PublicKey(Math.floor(check.suggestedBins.lower / 4096).toString()),
        binArrayUpper: new PublicKey(Math.floor(check.suggestedBins.upper / 4096).toString()),
      });

      const signature = await signAndSendTransaction(transaction);

      this.lastCheck.set(positionId, Date.now());
      this.positionStates.set(positionId, {
        id: positionId,
        lowerBinId: check.suggestedBins.lower,
        upperBinId: check.suggestedBins.upper,
        liquidity: position.liquidity,
        lastRebalance: Date.now(),
        healthScore: 100,
      });

      return {
        success: true,
        signature,
      };
    } catch (error) {
      console.error('Failed to execute rebalance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}