import { LiquidityBookServices, MODE } from '@saros-finance/dlmm-sdk';
import { SOLANA_RPC_ENDPOINT } from './config';
import { PoolMetadata, Bin } from './automation/types';

export interface IHealthMetrics {
  score: number;
  status: 'healthy' | 'warning' | 'critical';
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  issues: string[];
  recommendations: string[];
}

export interface HealthCheckResult {
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  issues: HealthIssue[];
    recommendations: string[];
}

export interface HealthIssue {
  type: 'deviation' | 'utilization' | 'liquidity' | 'range' | 'volatility';
  severity: 'low' | 'medium' | 'high';
    message: string;
  value: number;
  threshold: number;
}

export class PositionHealthMonitor {
  private static lb: LiquidityBookServices;
  private static readonly HEALTH_THRESHOLDS = {
    deviation: {
      warning: 10,
      critical: 20
    },
    utilization: {
      warning: 40,
      critical: 20
    },
    liquidity: {
      warning: 50,
      critical: 25
    },
    range: {
      warning: 60,
      critical: 30
    },
    volatility: {
      warning: 0.05,
      critical: 0.1
    }
  };

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

  static async checkHealth(
    position: any,
    poolAddress: string
  ): Promise<HealthCheckResult> {
    await this.initialize();

    try {
      const issues: HealthIssue[] = [];
      const recommendations: string[] = [];

      // Get pool metadata
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(poolAddress);
      if (!rawPoolMetadata) throw new Error('Failed to fetch pool metadata');
      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;

      const activeId = poolMetadata.activeId || 0;
      const binStep = poolMetadata.binStep || 0;

      // 1. Check deviation from active bin
      const positionCenter = Math.floor((position.lowerBinId + position.upperBinId) / 2);
      const deviation = Math.abs(positionCenter - activeId);
      const deviationPercent = (deviation * binStep * 100);

      if (deviationPercent >= this.HEALTH_THRESHOLDS.deviation.critical) {
        issues.push({
          type: 'deviation',
          severity: 'high',
          message: 'Position significantly deviated from active bin',
          value: deviationPercent,
          threshold: this.HEALTH_THRESHOLDS.deviation.critical
        });
        recommendations.push('Consider rebalancing position to center around active bin');
      } else if (deviationPercent >= this.HEALTH_THRESHOLDS.deviation.warning) {
        issues.push({
          type: 'deviation',
          severity: 'medium',
          message: 'Position moderately deviated from active bin',
          value: deviationPercent,
          threshold: this.HEALTH_THRESHOLDS.deviation.warning
        });
        recommendations.push('Monitor position deviation and consider rebalancing if it increases');
      }

      // 2. Check utilization
      const utilization = await this.calculateUtilization(position, poolAddress);
      if (utilization <= this.HEALTH_THRESHOLDS.utilization.critical) {
        issues.push({
          type: 'utilization',
          severity: 'high',
          message: 'Very low position utilization',
          value: utilization,
          threshold: this.HEALTH_THRESHOLDS.utilization.critical
        });
        recommendations.push('Consider narrowing position range to increase utilization');
      } else if (utilization <= this.HEALTH_THRESHOLDS.utilization.warning) {
        issues.push({
          type: 'utilization',
          severity: 'medium',
          message: 'Low position utilization',
          value: utilization,
          threshold: this.HEALTH_THRESHOLDS.utilization.warning
        });
        recommendations.push('Monitor utilization and consider adjusting range if it remains low');
      }

      // 3. Check liquidity distribution
      const liquidityScore = await this.calculateLiquidityScore(position, poolAddress);
      if (liquidityScore <= this.HEALTH_THRESHOLDS.liquidity.critical) {
        issues.push({
          type: 'liquidity',
          severity: 'high',
          message: 'Poor liquidity distribution',
          value: liquidityScore,
          threshold: this.HEALTH_THRESHOLDS.liquidity.critical
        });
        recommendations.push('Redistribute liquidity to optimize for current market conditions');
      } else if (liquidityScore <= this.HEALTH_THRESHOLDS.liquidity.warning) {
        issues.push({
          type: 'liquidity',
          severity: 'medium',
          message: 'Suboptimal liquidity distribution',
          value: liquidityScore,
          threshold: this.HEALTH_THRESHOLDS.liquidity.warning
        });
        recommendations.push('Consider optimizing liquidity distribution');
      }

      // 4. Check range coverage
      const rangeScore = await this.calculateRangeScore(position, poolAddress);
      if (rangeScore <= this.HEALTH_THRESHOLDS.range.critical) {
        issues.push({
          type: 'range',
          severity: 'high',
          message: 'Insufficient price range coverage',
          value: rangeScore,
          threshold: this.HEALTH_THRESHOLDS.range.critical
        });
        recommendations.push('Widen position range to better handle price movements');
      } else if (rangeScore <= this.HEALTH_THRESHOLDS.range.warning) {
        issues.push({
          type: 'range',
          severity: 'medium',
          message: 'Limited price range coverage',
          value: rangeScore,
          threshold: this.HEALTH_THRESHOLDS.range.warning
        });
        recommendations.push('Consider widening position range');
      }

      // 5. Check market volatility
      const volatility = await this.calculateVolatility(poolAddress);
      if (volatility >= this.HEALTH_THRESHOLDS.volatility.critical) {
        issues.push({
          type: 'volatility',
          severity: 'high',
          message: 'High market volatility',
          value: volatility,
          threshold: this.HEALTH_THRESHOLDS.volatility.critical
        });
        recommendations.push('Consider adjusting position for high volatility conditions');
      } else if (volatility >= this.HEALTH_THRESHOLDS.volatility.warning) {
        issues.push({
          type: 'volatility',
          severity: 'medium',
          message: 'Elevated market volatility',
          value: volatility,
          threshold: this.HEALTH_THRESHOLDS.volatility.warning
        });
        recommendations.push('Monitor volatility and prepare for potential adjustments');
      }

      // Calculate overall health score
      const score = this.calculateOverallScore(issues);
      const status = this.determineHealthStatus(score);

        return {
        score,
        status,
        issues,
        recommendations: [...new Set(recommendations)] // Remove duplicates
      };
    } catch (error) {
      console.error('Failed to check position health:', error);
      throw error;
    }
  }

  private static async calculateUtilization(
    position: any,
    poolAddress: string
  ): Promise<number> {
    try {
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(poolAddress);
      if (!rawPoolMetadata) return 0;
      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;

      const activeId = poolMetadata.activeId || 0;
      let totalLiquidity = 0;
      let activeBinLiquidity = 0;

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

  private static async calculateLiquidityScore(
    position: any,
    poolAddress: string
  ): Promise<number> {
    try {
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(poolAddress);
      if (!rawPoolMetadata) return 0;
      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;

      const activeId = poolMetadata.activeId || 0;
      const binRange = position.upperBinId - position.lowerBinId;
      const optimalDistribution = new Array(binRange + 1).fill(0);
      
      // Create optimal distribution curve (bell curve)
      for (let i = 0; i <= binRange; i++) {
        const x = (i - binRange / 2) / (binRange / 4);
        optimalDistribution[i] = Math.exp(-x * x / 2);
      }

      // Compare actual distribution to optimal
      let totalDifference = 0;
      let totalLiquidity = 0;

      for (let binId = position.lowerBinId; binId <= position.upperBinId; binId++) {
        const bin = await (this.lb as any).fetchBin(poolAddress, binId) as Bin;
        if (!bin) continue;

        const index = binId - position.lowerBinId;
        const actualLiquidity = bin.liquidity || 0;
        totalLiquidity += actualLiquidity;

        const optimalLiquidity = optimalDistribution[index];
        totalDifference += Math.abs(actualLiquidity - optimalLiquidity);
      }

      if (totalLiquidity === 0) return 0;

      // Convert difference to score (0-100)
      const maxPossibleDifference = binRange + 1; // Worst case scenario
      const differenceRatio = totalDifference / maxPossibleDifference;
      return Math.max(0, 100 - (differenceRatio * 100));
    } catch (error) {
      console.error('Failed to calculate liquidity score:', error);
      return 0;
    }
  }

  private static async calculateRangeScore(
    position: any,
    poolAddress: string
  ): Promise<number> {
    try {
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(poolAddress);
      if (!rawPoolMetadata) return 0;
      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;

      const binStep = poolMetadata.binStep || 0;
      const positionRange = position.upperBinId - position.lowerBinId;
      const idealRange = Math.floor(2 / binStep); // Arbitrary ideal range

      // Score based on how close the range is to ideal
      return Math.min(100, (positionRange * 100 / idealRange));
    } catch (error) {
      console.error('Failed to calculate range score:', error);
      return 0;
    }
  }

  private static async calculateVolatility(poolAddress: string): Promise<number> {
    try {
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(poolAddress);
      if (!rawPoolMetadata) return 0;
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

      if (totalWeight === 0) return 0;

      const weightedMean = prices.reduce((sum, price, i) => sum + price * weights[i], 0) / totalWeight;
      const weightedVariance = prices.reduce((sum, price, i) => {
        const deviation = price - weightedMean;
        return sum + weights[i] * deviation * deviation;
      }, 0) / totalWeight;

      return Math.sqrt(weightedVariance) / weightedMean;
    } catch (error) {
      console.error('Failed to calculate volatility:', error);
      return 0;
    }
  }

  private static calculateOverallScore(issues: HealthIssue[]): number {
    if (issues.length === 0) return 100;

    const severityWeights = {
      high: 1,
      medium: 0.6,
      low: 0.3
    };

    const totalWeight = issues.reduce((sum, issue) => sum + severityWeights[issue.severity], 0);
    const weightedScore = issues.reduce((sum, issue) => {
      const impact = (issue.value / issue.threshold) * severityWeights[issue.severity];
      return sum + impact;
    }, 0);

    return Math.max(0, Math.min(100, 100 - (weightedScore / totalWeight) * 100));
  }

  private static determineHealthStatus(score: number): 'healthy' | 'warning' | 'critical' {
    if (score >= 80) return 'healthy';
    if (score >= 50) return 'warning';
    return 'critical';
    }
}