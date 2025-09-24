import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DynamicRangeStrategy, VolatilityHarvestingStrategy } from '../strategy';
import { SarosDLMMService } from '../../dlmm-service';
import { PublicKey } from '@solana/web3.js';

describe('Automation Strategies', () => {
  let mockDlmmService: SarosDLMMService;
  let dynamicStrategy: DynamicRangeStrategy;
  let volatilityStrategy: VolatilityHarvestingStrategy;
  let mockPosition: any;
  let mockParams: any;

  beforeEach(() => {
    // Mock DLMM service
    mockDlmmService = {
      adjustPosition: vi.fn().mockResolvedValue(true),
      getPosition: vi.fn().mockResolvedValue({
        address: new PublicKey('11111111111111111111111111111111'),
        liquidity: 1000,
        lowerBinId: 95,
        upperBinId: 105,
      }),
    } as any;

    dynamicStrategy = new DynamicRangeStrategy(mockDlmmService);
    volatilityStrategy = new VolatilityHarvestingStrategy(mockDlmmService);

    mockPosition = {
      address: new PublicKey('11111111111111111111111111111111'),
      pool: new PublicKey('11111111111111111111111111111111'),
      owner: new PublicKey('11111111111111111111111111111111'),
      liquidity: 1000,
      lowerBinId: 95,
      upperBinId: 105,
      lastUpdateTime: Date.now(),
      healthFactor: 1.2,
    };

    mockParams = {
      position: mockPosition,
      currentPrice: 100,
      targetPriceRange: {
        lower: 90,
        upper: 110,
      },
      rebalanceThreshold: 0.05,
      minLiquidity: 100,
    };
  });

  describe('DynamicRangeStrategy', () => {
    it('should evaluate position correctly', async () => {
      const shouldRebalance = await dynamicStrategy.evaluate(mockParams);
      expect(typeof shouldRebalance).toBe('boolean');
    });

    it('should trigger rebalance when price moves significantly', async () => {
      const highPriceParams = {
        ...mockParams,
        currentPrice: 120, // Price moved significantly higher
      };
      const shouldRebalance = await dynamicStrategy.evaluate(highPriceParams);
      expect(shouldRebalance).toBe(true);
    });

    it('should not trigger rebalance for small price movements', async () => {
      const smallMoveParams = {
        ...mockParams,
        currentPrice: 101, // Small price movement
      };
      const shouldRebalance = await dynamicStrategy.evaluate(smallMoveParams);
      expect(shouldRebalance).toBe(false);
    });

    it('should execute rebalancing successfully', async () => {
      const success = await dynamicStrategy.execute(mockParams);
      expect(success).toBe(true);
      expect(mockDlmmService.adjustPosition).toHaveBeenCalled();
    });

    it('should handle execution errors gracefully', async () => {
      mockDlmmService.adjustPosition = vi.fn().mockRejectedValue(new Error('Adjustment failed'));
      const success = await dynamicStrategy.execute(mockParams);
      expect(success).toBe(false);
    });
  });

  describe('VolatilityHarvestingStrategy', () => {
    it('should evaluate market conditions correctly', async () => {
      const shouldRebalance = await volatilityStrategy.evaluate(mockParams);
      expect(typeof shouldRebalance).toBe('boolean');
    });

    it('should trigger rebalance in high volatility', async () => {
      // Mock high volatility conditions
      const highVolParams = {
        ...mockParams,
        rebalanceThreshold: 0.02, // Lower threshold to simulate high volatility
      };
      const shouldRebalance = await volatilityStrategy.evaluate(highVolParams);
      expect(shouldRebalance).toBe(true);
    });

    it('should adjust position size based on volatility', async () => {
      await volatilityStrategy.execute(mockParams);
      expect(mockDlmmService.adjustPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          position: mockPosition,
        })
      );
    });

    it('should maintain minimum liquidity requirements', async () => {
      const lowLiquidityParams = {
        ...mockParams,
        minLiquidity: 2000, // Higher than current liquidity
      };
      await volatilityStrategy.execute(lowLiquidityParams);
      const adjustmentCall = mockDlmmService.adjustPosition.mock.calls[0][0];
      expect(adjustmentCall.addAmount).toBeGreaterThanOrEqual(lowLiquidityParams.minLiquidity);
    });

    it('should handle execution errors gracefully', async () => {
      mockDlmmService.adjustPosition = vi.fn().mockRejectedValue(new Error('Adjustment failed'));
      const success = await volatilityStrategy.execute(mockParams);
      expect(success).toBe(false);
    });
  });

  describe('Strategy Integration', () => {
    it('should work with different price ranges', async () => {
      const testRanges = [
        { current: 100, lower: 90, upper: 110 },
        { current: 1000, lower: 900, upper: 1100 },
        { current: 0.1, lower: 0.09, upper: 0.11 },
      ];

      for (const range of testRanges) {
        const params = {
          ...mockParams,
          currentPrice: range.current,
          targetPriceRange: {
            lower: range.lower,
            upper: range.upper,
          },
        };

        // Test both strategies
        const dynamicResult = await dynamicStrategy.execute(params);
        const volatilityResult = await volatilityStrategy.execute(params);

        expect(dynamicResult).toBe(true);
        expect(volatilityResult).toBe(true);
      }
    });

    it('should handle extreme market conditions', async () => {
      const extremeParams = {
        ...mockParams,
        currentPrice: 1000000, // Extreme price
        rebalanceThreshold: 0.5, // High threshold
        minLiquidity: 1000000, // High liquidity requirement
      };

      // Both strategies should handle extreme conditions without throwing
      await expect(dynamicStrategy.execute(extremeParams)).resolves.not.toThrow();
      await expect(volatilityStrategy.execute(extremeParams)).resolves.not.toThrow();
    });

    it('should maintain consistent behavior over time', async () => {
      const timeframes = [
        Date.now(),
        Date.now() + 3600000, // 1 hour later
        Date.now() + 86400000, // 1 day later
      ];

      for (const time of timeframes) {
        const params = {
          ...mockParams,
          position: {
            ...mockPosition,
            lastUpdateTime: time,
          },
        };

        const dynamicResult = await dynamicStrategy.evaluate(params);
        const volatilityResult = await volatilityStrategy.evaluate(params);

        expect(typeof dynamicResult).toBe('boolean');
        expect(typeof volatilityResult).toBe('boolean');
      }
    });
  });
});
