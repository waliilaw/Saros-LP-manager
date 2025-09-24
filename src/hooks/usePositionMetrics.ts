import { useMemo } from 'react';
import { IDLMMPosition, IPositionMetrics } from '@/lib/saros/interfaces';

export interface AggregateMetrics {
  totalValueLocked: number;
  totalFeesEarned: number;
  volume24h: number;
  averageApr: number;
  impermanentLoss: number;
  healthyPositions: number;
  totalPositions: number;
}

export function usePositionMetrics(
  positions: IDLMMPosition[],
  positionMetrics: Map<string, IPositionMetrics>
): AggregateMetrics {
  return useMemo(() => {
    const totalValueLocked = positions.reduce((sum, pos) => sum + (pos.liquidity || 0), 0);
    const totalFeesEarned = Array.from(positionMetrics.values()).reduce(
      (sum, metrics) => sum + (metrics.feesEarned || 0),
      0
    );
    const volume24h = Array.from(positionMetrics.values()).reduce(
      (sum, metrics) => sum + (metrics.volume24h || 0),
      0
    );
    const averageApr = positions.length > 0
      ? Array.from(positionMetrics.values()).reduce(
          (sum, metrics) => sum + (metrics.apr || 0),
          0
        ) / positions.length
      : 0;
    const impermanentLoss = Array.from(positionMetrics.values()).reduce(
      (sum, metrics) => sum + (metrics.impermanentLoss || 0),
      0
    );
    const healthyPositions = positions.filter(pos => pos.healthFactor >= 1).length;

    return {
      totalValueLocked,
      totalFeesEarned,
      volume24h,
      averageApr,
      impermanentLoss,
      healthyPositions,
      totalPositions: positions.length,
    };
  }, [positions, positionMetrics]);
}

export function usePositionHistory(
  positions: IDLMMPosition[],
  positionMetrics: Map<string, IPositionMetrics>
): {
  tvlHistory: { timestamp: number; value: number }[];
  aprHistory: { timestamp: number; value: number }[];
  feesHistory: { timestamp: number; value: number }[];
  volumeHistory: { timestamp: number; value: number }[];
} {
  return useMemo(() => {
    const now = Date.now();
    const dayAgo = now - 86400000;

    const metrics = usePositionMetrics(positions, positionMetrics);

    return {
      tvlHistory: [
        { timestamp: dayAgo, value: metrics.totalValueLocked * 0.9 },
        { timestamp: now, value: metrics.totalValueLocked },
      ],
      aprHistory: [
        { timestamp: dayAgo, value: metrics.averageApr * 1.1 },
        { timestamp: now, value: metrics.averageApr },
      ],
      feesHistory: [
        { timestamp: dayAgo, value: metrics.totalFeesEarned * 0.8 },
        { timestamp: now, value: metrics.totalFeesEarned },
      ],
      volumeHistory: [
        { timestamp: dayAgo, value: metrics.volume24h * 1.2 },
        { timestamp: now, value: metrics.volume24h },
      ],
    };
  }, [positions, positionMetrics]);
}
