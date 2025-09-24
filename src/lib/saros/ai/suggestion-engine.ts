import { PublicKey } from '@solana/web3.js';
import { IDLMMPosition, IPositionMetrics, TimeSeriesData } from '../interfaces';

export interface MarketCondition {
  trend: 'bullish' | 'bearish' | 'sideways';
  volatility: 'low' | 'medium' | 'high';
  volume: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface PricePrediction {
  expectedPrice: number;
  upperBound: number;
  lowerBound: number;
  confidence: number;
  timeframe: '1h' | '4h' | '24h' | '7d';
}

export interface PositionSuggestion {
  type: 'new' | 'adjustment';
  confidence: number;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  strategy: {
    name: string;
    description: string;
    params: {
      lowerBinId: number;
      upperBinId: number;
      targetLiquidity: number;
      rebalanceThreshold: number;
    };
  };
  reasoning: string[];
  risks: string[];
  alternatives: Array<{
    strategy: string;
    tradeoffs: string[];
  }>;
}

export class AISuggestionEngine {
  constructor() {}

  private analyzeMarketConditions(priceHistory: TimeSeriesData[]): MarketCondition {
    if (priceHistory.length < 2) {
      throw new Error('Insufficient price history for analysis');
    }

    // Calculate trend
    const prices = priceHistory.map(p => p.value);
    const trend = this.calculateTrend(prices);
    
    // Calculate volatility
    const volatility = this.calculateVolatility(prices);
    
    // Calculate volume trend
    const volumes = priceHistory.map(p => p.value); // Assuming value represents volume
    const volumeTrend = this.calculateVolumeTrend(volumes);

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(prices.length, volatility);

    return {
      trend,
      volatility,
      volume: volumeTrend,
      confidence,
    };
  }

  private calculateTrend(prices: number[]): 'bullish' | 'bearish' | 'sideways' {
    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    const averageReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const threshold = 0.02; // 2% threshold

    if (averageReturn > threshold) return 'bullish';
    if (averageReturn < -threshold) return 'bearish';
    return 'sideways';
  }

  private calculateVolatility(prices: number[]): 'low' | 'medium' | 'high' {
    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    const volatility = Math.sqrt(
      returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length
    );

    if (volatility < 0.01) return 'low';
    if (volatility > 0.05) return 'high';
    return 'medium';
  }

  private calculateVolumeTrend(volumes: number[]): 'low' | 'medium' | 'high' {
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const recentVolume = volumes.slice(-24).reduce((a, b) => a + b, 0) / 24;

    if (recentVolume > avgVolume * 1.5) return 'high';
    if (recentVolume < avgVolume * 0.5) return 'low';
    return 'medium';
  }

  private calculateConfidence(dataPoints: number, volatility: 'low' | 'medium' | 'high'): number {
    let confidence = 0.5;

    // More data points increase confidence
    confidence += Math.min(0.3, dataPoints / 1000);

    // Adjust based on volatility
    switch (volatility) {
      case 'low':
        confidence += 0.2;
        break;
      case 'high':
        confidence -= 0.2;
        break;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private predictPrices(
    priceHistory: TimeSeriesData[],
    marketCondition: MarketCondition
  ): PricePrediction {
    const prices = priceHistory.map(p => p.value);
    const currentPrice = prices[prices.length - 1];
    
    // Calculate simple moving averages
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    
    // Calculate volatility
    const stdDev = this.calculateStdDev(prices);
    
    // Adjust predictions based on market conditions
    let expectedMove = 0;
    let confidenceAdjustment = 0;
    
    switch (marketCondition.trend) {
      case 'bullish':
        expectedMove = stdDev * 0.5;
        confidenceAdjustment = 0.1;
        break;
      case 'bearish':
        expectedMove = -stdDev * 0.5;
        confidenceAdjustment = 0.1;
        break;
      case 'sideways':
        expectedMove = (sma20 - currentPrice) * 0.3;
        confidenceAdjustment = -0.1;
        break;
    }

    const expectedPrice = currentPrice * (1 + expectedMove);
    const volatilityFactor = marketCondition.volatility === 'high' ? 2 :
                            marketCondition.volatility === 'medium' ? 1.5 : 1;

    return {
      expectedPrice,
      upperBound: expectedPrice * (1 + stdDev * volatilityFactor),
      lowerBound: expectedPrice * (1 - stdDev * volatilityFactor),
      confidence: Math.max(0, Math.min(1, marketCondition.confidence + confidenceAdjustment)),
      timeframe: '24h',
    };
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  private calculateStdDev(prices: number[]): number {
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const squaredDiffs = prices.map(p => Math.pow(p - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / prices.length);
  }

  private generateStrategySuggestion(
    marketCondition: MarketCondition,
    prediction: PricePrediction,
    position?: IDLMMPosition,
    metrics?: IPositionMetrics
  ): PositionSuggestion {
    const currentPrice = prediction.expectedPrice / (1 + prediction.expectedPrice);
    const volatilityFactor = 
      marketCondition.volatility === 'high' ? 0.1 :
      marketCondition.volatility === 'medium' ? 0.05 : 0.02;

    const suggestion: PositionSuggestion = {
      type: position ? 'adjustment' : 'new',
      confidence: prediction.confidence,
      expectedReturn: 0,
      riskLevel: marketCondition.volatility,
      strategy: {
        name: '',
        description: '',
        params: {
          lowerBinId: Math.floor(currentPrice * (1 - volatilityFactor)),
          upperBinId: Math.ceil(currentPrice * (1 + volatilityFactor)),
          targetLiquidity: position ? position.liquidity : 1000,
          rebalanceThreshold: volatilityFactor,
        },
      },
      reasoning: [],
      risks: [],
      alternatives: [],
    };

    // Adjust strategy based on market conditions
    switch (marketCondition.trend) {
      case 'bullish':
        suggestion.strategy.name = 'Bullish Range Strategy';
        suggestion.strategy.description = 'Asymmetric range position with higher upside coverage';
        suggestion.strategy.params.upperBinId = Math.ceil(currentPrice * (1 + volatilityFactor * 1.5));
        suggestion.expectedReturn = volatilityFactor * 150;
        suggestion.reasoning = [
          'Strong upward trend detected',
          'Higher volume supporting price movement',
          'Expanded upper range to capture upside',
        ];
        break;

      case 'bearish':
        suggestion.strategy.name = 'Defensive Range Strategy';
        suggestion.strategy.description = 'Conservative range with emphasis on fee generation';
        suggestion.strategy.params.upperBinId = Math.ceil(currentPrice * (1 + volatilityFactor * 0.8));
        suggestion.expectedReturn = volatilityFactor * 80;
        suggestion.reasoning = [
          'Bearish trend detected',
          'Reduced position range to minimize IL',
          'Focus on fee generation over price exposure',
        ];
        break;

      case 'sideways':
        suggestion.strategy.name = 'Neutral Range Strategy';
        suggestion.strategy.description = 'Balanced range position for sideways markets';
        suggestion.expectedReturn = volatilityFactor * 100;
        suggestion.reasoning = [
          'Sideways market detected',
          'Balanced range around current price',
          'Optimal for fee generation in current conditions',
        ];
        break;
    }

    // Add common risks
    suggestion.risks = [
      'Unexpected market volatility may lead to range exits',
      'Impermanent loss if price moves significantly',
      `${marketCondition.confidence * 100}% confidence in market analysis`,
    ];

    // Add alternative strategies
    suggestion.alternatives = [
      {
        strategy: 'Wide Range Strategy',
        tradeoffs: [
          'Lower fee generation',
          'Reduced impermanent loss risk',
          'Better for uncertain market conditions',
        ],
      },
      {
        strategy: 'Narrow Range Strategy',
        tradeoffs: [
          'Higher fee generation potential',
          'Increased impermanent loss risk',
          'Requires more active management',
        ],
      },
    ];

    return suggestion;
  }

  async generateSuggestions(
    priceHistory: TimeSeriesData[],
    position?: IDLMMPosition,
    metrics?: IPositionMetrics
  ): Promise<{
    marketCondition: MarketCondition;
    prediction: PricePrediction;
    suggestion: PositionSuggestion;
  }> {
    const marketCondition = this.analyzeMarketConditions(priceHistory);
    const prediction = this.predictPrices(priceHistory, marketCondition);
    const suggestion = this.generateStrategySuggestion(
      marketCondition,
      prediction,
      position,
      metrics
    );

    return {
      marketCondition,
      prediction,
      suggestion,
    };
  }
}
