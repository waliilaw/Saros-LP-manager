import { describe, it, expect } from 'vitest';
import { PositionHealthMonitor } from '@/lib/saros/position-health';
import { IDLMMPosition, IPositionMetrics } from '@/lib/saros/interfaces';
import { PublicKey } from '@solana/web3.js';

describe('PositionHealthMonitor', () => {
    const mockPosition: IDLMMPosition = {
        address: new PublicKey('11111111111111111111111111111111'),
        tokenXDeposited: BigInt(1000000),
        tokenYDeposited: BigInt(1000000),
        feesEarnedX: BigInt(5000),
        feesEarnedY: BigInt(5000),
        lastUpdatedAt: Date.now(),
        lowerBinId: 1000,
        upperBinId: 2000,
    };

    const mockMetrics: IPositionMetrics = {
        totalValueLocked: 10000,
        apr: 15,
        priceRange: {
            min: 0.8,
            current: 1.2,
            max: 1.5
        },
        impermanentLoss: 100,
        volumeLast24h: 50000,
        feesLast24h: 25,
        binUtilization: 75
    };

    it('should calculate health score correctly', () => {
        const monitor = new PositionHealthMonitor();
        const health = monitor.calculateHealth(mockPosition, mockMetrics);

        expect(health).toBeDefined();
        expect(health.healthScore).toBeGreaterThanOrEqual(0);
        expect(health.healthScore).toBeLessThanOrEqual(100);
    });

    it('should identify price range deviation risks', () => {
        const monitor = new PositionHealthMonitor();
        const metricsWithHighDeviation: IPositionMetrics = {
            ...mockMetrics,
            priceRange: {
                min: 0.5,
                current: 2.0,
                max: 1.5
            }
        };

        const health = monitor.calculateHealth(mockPosition, metricsWithHighDeviation);
        const priceWarning = health.warnings.find(w => w.type === 'PRICE_RANGE_DEVIATION');

        expect(priceWarning).toBeDefined();
        expect(priceWarning?.severity).toBe('HIGH');
    });

    it('should identify low liquidity risks', () => {
        const monitor = new PositionHealthMonitor();
        const metricsWithLowLiquidity: IPositionMetrics = {
            ...mockMetrics,
            totalValueLocked: 500 // Below minimum threshold
        };

        const health = monitor.calculateHealth(mockPosition, metricsWithLowLiquidity);
        const liquidityWarning = health.warnings.find(w => w.type === 'LOW_LIQUIDITY');

        expect(liquidityWarning).toBeDefined();
        expect(liquidityWarning?.severity).toBe('MEDIUM');
    });

    it('should identify high impermanent loss risks', () => {
        const monitor = new PositionHealthMonitor();
        const metricsWithHighIL: IPositionMetrics = {
            ...mockMetrics,
            totalValueLocked: 10000,
            impermanentLoss: 1000 // 10% IL
        };

        const health = monitor.calculateHealth(mockPosition, metricsWithHighIL);
        const ilWarning = health.warnings.find(w => w.type === 'HIGH_IL_RISK');

        expect(ilWarning).toBeDefined();
        expect(ilWarning?.severity).toBe('HIGH');
    });

    it('should provide recommendations for identified risks', () => {
        const monitor = new PositionHealthMonitor();
        const health = monitor.calculateHealth(mockPosition, mockMetrics);

        expect(health.recommendations).toBeDefined();
        expect(health.recommendations.length).toBeGreaterThan(0);
        expect(health.recommendations[0]).toBeTypeOf('string');
    });
});