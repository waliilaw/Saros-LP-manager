import { describe, it, expect, beforeEach } from 'vitest';
import { AISuggestionEngine } from '../suggestion-engine';
import { TimeSeriesData } from '../../interfaces';
import { PublicKey } from '@solana/web3.js';

describe('AISuggestionEngine', () => {
  let engine: AISuggestionEngine;
  let mockPriceHistory: TimeSeriesData[];
  let mockPosition: any;
  let mockMetrics: any;

  beforeEach(() => {
    engine = new AISuggestionEngine();

    // Mock price history data
    mockPriceHistory = [
      { timestamp: Date.now() - 86400000 * 7, value: 100 },
      { timestamp: Date.now() - 86400000 * 6, value: 102 },
      { timestamp: Date.now() - 86400000 * 5, value: 105 },
      { timestamp: Date.now() - 86400000 * 4, value: 103 },
      { timestamp: Date.now() - 86400000 * 3, value: 106 },
      { timestamp: Date.now() - 86400000 * 2, value: 108 },
      { timestamp: Date.now() - 86400000 * 1, value: 110 },
      { timestamp: Date.now(), value: 112 },
    ];

    // Mock position data
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

    // Mock metrics data
    mockMetrics = {
      feesEarned: 50,
      volume24h: 10000,
      apr: 0.15,
      impermanentLoss: 10,
      priceRange: {
        lower: 95,
        upper: 105,
      },
      utilization: 0.8,
      healthScore: 0.9,
    };
  });

  describe('Market Analysis', () => {
    it('should detect bullish trend correctly', async () => {
      const { marketCondition } = await engine.generateSuggestions(mockPriceHistory);
      expect(marketCondition.trend).toBe('bullish');
      expect(marketCondition.confidence).toBeGreaterThan(0.5);
    });

    it('should detect bearish trend correctly', async () => {
      const bearishPriceHistory = mockPriceHistory.map((p, i) => ({
        ...p,
        value: 112 - i * 2,
      }));
      const { marketCondition } = await engine.generateSuggestions(bearishPriceHistory);
      expect(marketCondition.trend).toBe('bearish');
    });

    it('should detect sideways trend correctly', async () => {
      const sidewaysPriceHistory = mockPriceHistory.map(p => ({
        ...p,
        value: 100 + Math.random() * 2,
      }));
      const { marketCondition } = await engine.generateSuggestions(sidewaysPriceHistory);
      expect(marketCondition.trend).toBe('sideways');
    });

    it('should calculate volatility correctly', async () => {
      const highVolPriceHistory = mockPriceHistory.map((p, i) => ({
        ...p,
        value: 100 + Math.sin(i) * 20,
      }));
      const { marketCondition } = await engine.generateSuggestions(highVolPriceHistory);
      expect(marketCondition.volatility).toBe('high');
    });
  });

  describe('Price Predictions', () => {
    it('should generate reasonable price predictions', async () => {
      const { prediction } = await engine.generateSuggestions(mockPriceHistory);
      
      expect(prediction.expectedPrice).toBeGreaterThan(mockPriceHistory[mockPriceHistory.length - 1].value * 0.9);
      expect(prediction.expectedPrice).toBeLessThan(mockPriceHistory[mockPriceHistory.length - 1].value * 1.1);
      expect(prediction.lowerBound).toBeLessThan(prediction.expectedPrice);
      expect(prediction.upperBound).toBeGreaterThan(prediction.expectedPrice);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });

    it('should adjust confidence based on volatility', async () => {
      const highVolPriceHistory = mockPriceHistory.map((p, i) => ({
        ...p,
        value: 100 + Math.sin(i) * 20,
      }));
      const { prediction: highVolPrediction } = await engine.generateSuggestions(highVolPriceHistory);
      const { prediction: normalPrediction } = await engine.generateSuggestions(mockPriceHistory);

      expect(highVolPrediction.confidence).toBeLessThan(normalPrediction.confidence);
    });
  });

  describe('Strategy Suggestions', () => {
    it('should generate appropriate suggestions for bullish market', async () => {
      const { suggestion } = await engine.generateSuggestions(
        mockPriceHistory,
        mockPosition,
        mockMetrics
      );

      expect(suggestion.strategy.name).toContain('Bullish');
      expect(suggestion.expectedReturn).toBeGreaterThan(0);
      expect(suggestion.strategy.params.upperBinId).toBeGreaterThan(suggestion.strategy.params.lowerBinId);
      expect(suggestion.confidence).toBeGreaterThan(0);
      expect(suggestion.confidence).toBeLessThanOrEqual(1);
    });

    it('should generate defensive suggestions for bearish market', async () => {
      const bearishPriceHistory = mockPriceHistory.map((p, i) => ({
        ...p,
        value: 112 - i * 2,
      }));
      const { suggestion } = await engine.generateSuggestions(
        bearishPriceHistory,
        mockPosition,
        mockMetrics
      );

      expect(suggestion.strategy.name).toContain('Defensive');
      expect(suggestion.riskLevel).toBe('low');
      expect(suggestion.strategy.params.upperBinId - suggestion.strategy.params.lowerBinId)
        .toBeLessThan(mockPosition.upperBinId - mockPosition.lowerBinId);
    });

    it('should provide reasonable suggestions for new positions', async () => {
      const { suggestion } = await engine.generateSuggestions(mockPriceHistory);

      expect(suggestion.type).toBe('new');
      expect(suggestion.strategy.params.lowerBinId).toBeDefined();
      expect(suggestion.strategy.params.upperBinId).toBeDefined();
      expect(suggestion.strategy.params.targetLiquidity).toBeGreaterThan(0);
      expect(suggestion.reasoning.length).toBeGreaterThan(0);
      expect(suggestion.risks.length).toBeGreaterThan(0);
      expect(suggestion.alternatives.length).toBeGreaterThan(0);
    });

    it('should adjust suggestions based on position health', async () => {
      const unhealthyPosition = {
        ...mockPosition,
        healthFactor: 0.7,
      };
      const { suggestion } = await engine.generateSuggestions(
        mockPriceHistory,
        unhealthyPosition,
        mockMetrics
      );

      expect(suggestion.riskLevel).toBe('high');
      expect(suggestion.recommendations).toContain(expect.stringMatching(/health|risk/i));
    });
  });

  describe('Error Handling', () => {
    it('should handle insufficient price history', async () => {
      const insufficientHistory = mockPriceHistory.slice(0, 1);
      await expect(engine.generateSuggestions(insufficientHistory))
        .rejects.toThrow('Insufficient price history');
    });

    it('should handle invalid position data', async () => {
      const invalidPosition = {
        ...mockPosition,
        liquidity: -1000,
      };
      const { suggestion } = await engine.generateSuggestions(
        mockPriceHistory,
        invalidPosition,
        mockMetrics
      );

      expect(suggestion.riskLevel).toBe('high');
      expect(suggestion.confidence).toBeLessThan(0.5);
    });
  });
});
