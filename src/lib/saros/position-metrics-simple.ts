import { LiquidityBookServices, MODE } from '@saros-finance/dlmm-sdk';
import { SOLANA_RPC_ENDPOINT } from './config';
import { PoolMetadata, Bin } from './automation/types';

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

export class PositionMetricsService {
  private static lb: LiquidityBookServices;

  private static async initialize() {
    if (!this.lb) {
      this.lb = new LiquidityBookServices({
        mode: MODE.DEVNET,
        options: { 
          rpcUrl: SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com'
        },
      });
    }
  }

  static async calculateImpermanentLoss(
    initialPrice: number,
    currentPrice: number,
    positionValueAtEntry: number
  ): Promise<number> {
    const priceRatio = currentPrice / initialPrice;
    const sqrtRatio = Math.sqrt(priceRatio);
    
    // Calculate IL using constant product formula
    const hodlValue = positionValueAtEntry * priceRatio;
    const lpValue = 2 * positionValueAtEntry * sqrtRatio / (1 + priceRatio);
    
    return (lpValue - hodlValue) / hodlValue;
  }

  static async calculatePositionValue(
    position: any,
    currentPriceX: number
  ): Promise<number> {
    await this.initialize();

    try {
      let totalValue = 0;

      // Fetch bins in position range
      for (let binId = position.lowerBinId; binId <= position.upperBinId; binId++) {
        const bin = await (this.lb as any).fetchBin(position.pair.toString(), binId) as Bin;
        if (!bin) continue;

        // Calculate value in terms of token X
        const binValue = bin.amountX + (bin.amountY * currentPriceX);
        totalValue += binValue;
      }

      return totalValue;
    } catch (error) {
      console.error('Failed to calculate position value:', error);
      return 0;
    }
  }

  static async calculateFeesEarned(
    position: any,
    currentPriceX: number,
    timeframe: number = 24
  ): Promise<{ total: number; hourly: number }> {
    await this.initialize();

    try {
      let totalFees = 0;
      const startTime = Date.now() - (timeframe * 60 * 60 * 1000);

      // Get pool events
      const events = await (this.lb as any).fetchPoolEvents(position.pair.toString(), startTime);
      if (!events) return { total: 0, hourly: 0 };

      // Sum up fees from swap events
      for (const event of events) {
        if (event.type === 'swap' && event.fees) {
          totalFees += event.fees;
        }
      }

      return {
        total: totalFees,
        hourly: totalFees / timeframe
      };
    } catch (error) {
      console.error('Failed to calculate fees earned:', error);
      return { total: 0, hourly: 0 };
    }
  }

  static async calculateUtilization(
    position: any,
    poolAddress: string
  ): Promise<number> {
    await this.initialize();

    try {
      // Get pool metadata
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(poolAddress);
      if (!rawPoolMetadata) return 0;
      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;

      const activeId = poolMetadata.activeId || 0;
      let totalLiquidity = 0;
      let activeBinLiquidity = 0;

      // Calculate total liquidity in position range
      for (let binId = position.lowerBinId; binId <= position.upperBinId; binId++) {
        const bin = await (this.lb as any).fetchBin(poolAddress, binId) as Bin;
        if (!bin) continue;

        totalLiquidity += bin.liquidity || 0;
        if (binId === activeId) {
          activeBinLiquidity = bin.liquidity || 0;
        }
      }

      return totalLiquidity > 0 ? (activeBinLiquidity / totalLiquidity) * 100 : 0;
    } catch (error) {
      console.error('Failed to calculate utilization:', error);
      return 0;
    }
  }

  static calculateBinPrice(binId: number, binStep: number): number {
    return Math.pow(1 + binStep, binId);
  }

  static async calculateHealthScore(
    position: any,
    poolAddress: string,
    currentPrice: number
  ): Promise<number> {
    await this.initialize();

    try {
      // Get pool metadata
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(poolAddress);
      if (!rawPoolMetadata) return 0;
      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;

      const activeId = poolMetadata.activeId || 0;
      const binStep = poolMetadata.binStep || 0;

      // Calculate deviation from active bin
      const positionCenter = Math.floor((position.lowerBinId + position.upperBinId) / 2);
      const deviation = Math.abs(positionCenter - activeId);
      const maxDeviation = 100; // Arbitrary max deviation
      const deviationScore = Math.max(0, 100 - (deviation * 100 / maxDeviation));

      // Calculate price range coverage
      const positionRange = position.upperBinId - position.lowerBinId;
      const idealRange = Math.floor(2 / binStep); // Arbitrary ideal range
      const coverageScore = Math.min(100, (positionRange * 100 / idealRange));

      // Calculate liquidity distribution
      const utilization = await this.calculateUtilization(position, poolAddress);
      const liquidityWeight = Math.min(100, utilization);

      // Combine scores with weights
      return (
        deviationScore * 0.4 +  // Distance from active bin
        coverageScore * 0.3 +   // Price range coverage
        liquidityWeight * 0.3    // Liquidity distribution
      );
    } catch (error) {
      console.error('Failed to calculate health score:', error);
      return 0;
    }
  }

  static async getMetrics(
    position: any,
    poolAddress: string,
    currentPrice: number,
    timeframe: number = 24
  ): Promise<IPositionMetrics> {
    await this.initialize();

    try {
      const [
        feesData,
        utilization,
        healthScore,
        impermanentLoss
      ] = await Promise.all([
        this.calculateFeesEarned(position, currentPrice, timeframe),
        this.calculateUtilization(position, poolAddress),
        this.calculateHealthScore(position, poolAddress, currentPrice),
        this.calculateImpermanentLoss(
          position.entryPrice || currentPrice,
          currentPrice,
          position.initialValue || await this.calculatePositionValue(position, currentPrice)
        )
      ]);

      // Get pool metadata for price calculations
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(poolAddress);
      if (!rawPoolMetadata) throw new Error('Failed to fetch pool metadata');
      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;

      const binStep = poolMetadata.binStep || 0;
      const lowerPrice = this.calculateBinPrice(position.lowerBinId, binStep);
      const upperPrice = this.calculateBinPrice(position.upperBinId, binStep);

      // Calculate APR based on fees
      const positionValue = await this.calculatePositionValue(position, currentPrice);
      const apr = positionValue > 0
        ? (feesData.hourly * 24 * 365 * 100) / positionValue
        : 0;

      return {
        feesEarned: feesData.total,
        volume24h: feesData.hourly * 24,
        apr,
        impermanentLoss,
        priceRange: {
          lower: lowerPrice,
          upper: upperPrice
        },
        utilization,
        healthScore
      };
    } catch (error) {
      console.error('Failed to get metrics:', error);
      throw error;
    }
  }
}