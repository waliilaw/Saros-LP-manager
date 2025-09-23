import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RebalancingStrategy } from '@/lib/saros/automation/strategy';
import { IDLMMPosition, IPositionMetrics } from '@/lib/saros/interfaces';
import { IHealthMetrics } from '@/lib/saros/position-health';
import { PublicKey } from '@solana/web3.js';

describe('RebalancingStrategy', () => {
    let strategy: RebalancingStrategy;
    
    const mockPosition: IDLMMPosition = {
        address: new PublicKey('11111111111111111111111111111111'),
        owner: new PublicKey('11111111111111111111111111111111'),
        pool: new PublicKey('11111111111111111111111111111111'),
        tokenXDeposited: BigInt(1000000),
        tokenYDeposited: BigInt(1000000),
        feesEarnedX: BigInt(5000),
        feesEarnedY: BigInt(5000),
        lastUpdatedAt: Date.now(),
        lowerBinId: 1000,
        upperBinId: 2000,
        liquidityShares: [BigInt(1000)],
        healthFactor: 100
    };

    beforeEach(() => {
        vi.mock('../lib/saros/position-health', () => ({
            PositionHealthMonitor: vi.fn().mockImplementation(() => ({
                calculateHealth: vi.fn()
            }))
        }));
        strategy = new RebalancingStrategy();
    });

    it('should have correct strategy identification', () => {
        expect(strategy.id).toBe('auto-rebalance');
        expect(strategy.name).toBe('Auto Rebalancing');
        expect(strategy.description).toBeDefined();
    });

    const mockMetrics: IPositionMetrics = {
        totalValueLocked: 10000,
        apr: 15,
        priceRange: {
            min: 0.8,
            current: 1.0,
            max: 1.5
        },
        impermanentLoss: 100,
        volumeLast24h: 50000,
        feesLast24h: 25,
        binUtilization: 75
    };

    const mockHealthHighPriceDeviation: IHealthMetrics = {
        healthScore: 70,
        riskLevel: 'HIGH',
        warnings: [{
            type: 'PRICE_RANGE_DEVIATION',
            severity: 'HIGH',
            message: 'Price has moved significantly out of range'
        }],
        recommendations: ['Consider adjusting position range']
    };

    const mockHealthHighIL: IHealthMetrics = {
        healthScore: 60,
        riskLevel: 'HIGH',
        warnings: [{
            type: 'HIGH_IL_RISK',
            severity: 'HIGH',
            message: 'High impermanent loss risk detected'
        }],
        recommendations: ['Consider reducing position size']
    };

    const mockHealthNormal: IHealthMetrics = {
        healthScore: 90,
        riskLevel: 'LOW',
        warnings: [],
        recommendations: []
    };

    it('should trigger rebalancing on high price deviation', async () => {
        const calculateHealth = vi.fn().mockReturnValue(mockHealthHighPriceDeviation);
        vi.mocked(strategy['healthMonitor'].calculateHealth).mockImplementation(calculateHealth);
        
        const adjustRangeSpy = vi.spyOn(strategy, 'adjustPositionRange');
        
        await strategy.checkAndExecute(mockPosition, mockMetrics);
        
        expect(adjustRangeSpy).toHaveBeenCalledWith(mockPosition, mockMetrics);
    });

    it('should trigger liquidity addition on high utilization', async () => {
        const mockMetricsHighUtil = { ...mockMetrics, binUtilization: 95 };
        const calculateHealth = vi.fn().mockReturnValue(mockHealthNormal);
        vi.mocked(strategy['healthMonitor'].calculateHealth).mockImplementation(calculateHealth);
        
        const addLiquiditySpy = vi.spyOn(strategy, 'addLiquidity');
        
        await strategy.checkAndExecute(mockPosition, mockMetricsHighUtil);
        
        expect(addLiquiditySpy).toHaveBeenCalledWith(mockPosition, mockMetricsHighUtil);
    });

    it('should trigger position reduction on high IL risk', async () => {
        const calculateHealth = vi.fn().mockReturnValue(mockHealthHighIL);
        vi.mocked(strategy['healthMonitor'].calculateHealth).mockImplementation(calculateHealth);
        
        const removeLiquiditySpy = vi.spyOn(strategy, 'removeLiquidity');
        
        await strategy.checkAndExecute(mockPosition, mockMetrics);
        
        expect(removeLiquiditySpy).toHaveBeenCalledWith(mockPosition, mockMetrics);
    });

    it('should not trigger any actions when metrics are normal', async () => {
        const calculateHealth = vi.fn().mockReturnValue(mockHealthNormal);
        vi.mocked(strategy['healthMonitor'].calculateHealth).mockImplementation(calculateHealth);
        
        const adjustRangeSpy = vi.spyOn(strategy, 'adjustPositionRange');
        const addLiquiditySpy = vi.spyOn(strategy, 'addLiquidity');
        const removeLiquiditySpy = vi.spyOn(strategy, 'removeLiquidity');
        
        await strategy.checkAndExecute(mockPosition, mockMetrics);
        
        expect(adjustRangeSpy).not.toHaveBeenCalled();
        expect(addLiquiditySpy).not.toHaveBeenCalled();
        expect(removeLiquiditySpy).not.toHaveBeenCalled();
    });
});