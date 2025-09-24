import { IDLMMPosition, IPositionMetrics } from '../interfaces';

export interface ComparisonMetrics {
  position: IDLMMPosition;
  metrics: IPositionMetrics;
  analysis: {
    riskScore: number;
    efficiencyScore: number;
    healthScore: number;
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  relativePerfomance: {
    aprPercentile: number;
    volumePercentile: number;
    feesPercentile: number;
    healthPercentile: number;
  };
}

export class ComparisonEngine {
  calculateRiskScore(position: IDLMMPosition, metrics: IPositionMetrics): number {
    const volatilityFactor = metrics.volume24h / position.liquidity;
    const rangeWidth = position.upperBinId - position.lowerBinId;
    const ilRisk = metrics.impermanentLoss / position.liquidity;

    // Normalize and combine factors (lower is better)
    const normalizedScore = (
      (volatilityFactor * 0.3) +
      (rangeWidth * 0.3) +
      (ilRisk * 0.4)
    );

    // Convert to 0-100 scale (higher is better)
    return Math.max(0, Math.min(100, (1 - normalizedScore) * 100));
  }

  calculateEfficiencyScore(position: IDLMMPosition, metrics: IPositionMetrics): number {
    const feeAPR = (metrics.feesEarned / position.liquidity) * 365;
    const utilization = metrics.volume24h / position.liquidity;
    const rangeEfficiency = metrics.volume24h / (position.upperBinId - position.lowerBinId);

    // Normalize and combine factors (higher is better)
    const normalizedScore = (
      (feeAPR * 0.4) +
      (utilization * 0.3) +
      (rangeEfficiency * 0.3)
    );

    // Convert to 0-100 scale
    return Math.max(0, Math.min(100, normalizedScore * 100));
  }

  calculateHealthScore(position: IDLMMPosition): number {
    // Convert health factor to 0-100 scale
    return Math.max(0, Math.min(100, position.healthFactor * 100));
  }

  calculateOverallScore(riskScore: number, efficiencyScore: number, healthScore: number): number {
    return (riskScore * 0.3) + (efficiencyScore * 0.4) + (healthScore * 0.3);
  }

  analyzeStrengthsWeaknesses(
    position: IDLMMPosition,
    metrics: IPositionMetrics,
    scores: {
      riskScore: number;
      efficiencyScore: number;
      healthScore: number;
    }
  ): { strengths: string[]; weaknesses: string[]; recommendations: string[] } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Analyze risk score
    if (scores.riskScore >= 80) {
      strengths.push('Well-managed risk exposure');
    } else if (scores.riskScore <= 40) {
      weaknesses.push('High risk exposure');
      recommendations.push('Consider reducing position range to minimize impermanent loss risk');
    }

    // Analyze efficiency score
    if (scores.efficiencyScore >= 80) {
      strengths.push('Excellent fee generation efficiency');
    } else if (scores.efficiencyScore <= 40) {
      weaknesses.push('Low fee generation efficiency');
      recommendations.push('Consider adjusting position range to capture more trading volume');
    }

    // Analyze health score
    if (scores.healthScore >= 80) {
      strengths.push('Strong position health');
    } else if (scores.healthScore <= 40) {
      weaknesses.push('Poor position health');
      recommendations.push('Monitor position health closely and consider rebalancing');
    }

    // Analyze range width
    const rangeWidth = position.upperBinId - position.lowerBinId;
    if (rangeWidth > 1000) {
      weaknesses.push('Very wide price range');
      recommendations.push('Consider narrowing price range for better capital efficiency');
    } else if (rangeWidth < 100) {
      strengths.push('Focused price range for optimal capital efficiency');
    }

    // Analyze fee generation
    const feeAPR = (metrics.feesEarned / position.liquidity) * 365;
    if (feeAPR > 0.2) { // 20% APR
      strengths.push('Strong fee generation');
    } else if (feeAPR < 0.05) { // 5% APR
      weaknesses.push('Low fee generation');
      recommendations.push('Evaluate current fee tier and consider adjusting strategy');
    }

    return { strengths, weaknesses, recommendations };
  }

  calculatePercentiles(
    position: IDLMMPosition,
    metrics: IPositionMetrics,
    allPositions: IDLMMPosition[],
    allMetrics: Map<string, IPositionMetrics>
  ): {
    aprPercentile: number;
    volumePercentile: number;
    feesPercentile: number;
    healthPercentile: number;
  } {
    const allMetricsArray = Array.from(allMetrics.values());
    
    // Calculate APR percentile
    const positionAPR = (metrics.feesEarned / position.liquidity) * 365;
    const allAPRs = allMetricsArray.map(m => (m.feesEarned / position.liquidity) * 365);
    const aprPercentile = this.calculatePercentile(positionAPR, allAPRs);

    // Calculate volume percentile
    const allVolumes = allMetricsArray.map(m => m.volume24h);
    const volumePercentile = this.calculatePercentile(metrics.volume24h, allVolumes);

    // Calculate fees percentile
    const allFees = allMetricsArray.map(m => m.feesEarned);
    const feesPercentile = this.calculatePercentile(metrics.feesEarned, allFees);

    // Calculate health percentile
    const allHealth = allPositions.map(p => p.healthFactor);
    const healthPercentile = this.calculatePercentile(position.healthFactor, allHealth);

    return {
      aprPercentile,
      volumePercentile,
      feesPercentile,
      healthPercentile,
    };
  }

  private calculatePercentile(value: number, array: number[]): number {
    const sorted = array.sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    return (index / sorted.length) * 100;
  }

  comparePositions(
    positions: IDLMMPosition[],
    metricsMap: Map<string, IPositionMetrics>
  ): ComparisonMetrics[] {
    return positions.map(position => {
      const metrics = metricsMap.get(position.address.toString());
      if (!metrics) {
        throw new Error(`Metrics not found for position ${position.address.toString()}`);
      }

      const riskScore = this.calculateRiskScore(position, metrics);
      const efficiencyScore = this.calculateEfficiencyScore(position, metrics);
      const healthScore = this.calculateHealthScore(position);
      const overallScore = this.calculateOverallScore(riskScore, efficiencyScore, healthScore);

      const { strengths, weaknesses, recommendations } = this.analyzeStrengthsWeaknesses(
        position,
        metrics,
        { riskScore, efficiencyScore, healthScore }
      );

      const relativePerfomance = this.calculatePercentiles(
        position,
        metrics,
        positions,
        metricsMap
      );

      return {
        position,
        metrics,
        analysis: {
          riskScore,
          efficiencyScore,
          healthScore,
          overallScore,
          strengths,
          weaknesses,
          recommendations,
        },
        relativePerfomance,
      };
    });
  }
}
