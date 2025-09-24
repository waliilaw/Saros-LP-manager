import { PublicKey } from '@solana/web3.js';
import { IRebalancingStrategy } from '../automation/strategy';
import { IDLMMPosition, TimeSeriesData } from '../interfaces';

export interface BacktestParams {
  startTime: number;
  endTime: number;
  initialLiquidity: number;
  strategy: IRebalancingStrategy;
  priceData: TimeSeriesData[];
  binRange: {
    lower: number;
    upper: number;
  };
  fees: {
    swapFee: number;
    hostFee: number;
  };
}

export interface BacktestResult {
  returns: number;
  apr: number;
  impermanentLoss: number;
  feesEarned: number;
  totalTrades: number;
  successfulTrades: number;
  maxDrawdown: number;
  volatility: number;
  sharpeRatio: number;
  positions: SimulatedPosition[];
  metrics: TimeSeriesData[];
}

interface SimulatedPosition {
  timestamp: number;
  liquidity: number;
  lowerBinId: number;
  upperBinId: number;
  fees: number;
  value: number;
}

export class BacktestEngine {
  constructor() {}

  async runBacktest(params: BacktestParams): Promise<BacktestResult> {
    const {
      startTime,
      endTime,
      initialLiquidity,
      strategy,
      priceData,
      binRange,
      fees,
    } = params;

    // Filter price data within time range
    const relevantPriceData = priceData.filter(
      data => data.timestamp >= startTime && data.timestamp <= endTime
    );

    if (relevantPriceData.length < 2) {
      throw new Error('Insufficient price data for backtesting');
    }

    const positions: SimulatedPosition[] = [];
    const metrics: TimeSeriesData[] = [];
    let currentPosition: SimulatedPosition = {
      timestamp: startTime,
      liquidity: initialLiquidity,
      lowerBinId: binRange.lower,
      upperBinId: binRange.upper,
      fees: 0,
      value: initialLiquidity,
    };

    let totalFeesEarned = 0;
    let totalTrades = 0;
    let successfulTrades = 0;
    let maxValue = initialLiquidity;
    let minValue = initialLiquidity;
    let returns: number[] = [];

    // Simulate trading
    for (let i = 1; i < relevantPriceData.length; i++) {
      const prevPrice = relevantPriceData[i - 1].value;
      const currentPrice = relevantPriceData[i].value;
      const timestamp = relevantPriceData[i].timestamp;

      // Calculate position value and fees
      const priceChange = (currentPrice - prevPrice) / prevPrice;
      const volumeEstimate = Math.abs(priceChange) * currentPosition.value;
      const feeEarned = volumeEstimate * fees.swapFee * (1 - fees.hostFee);

      currentPosition.fees += feeEarned;
      totalFeesEarned += feeEarned;

      // Simulate impermanent loss
      const ilFactor = Math.sqrt(priceChange + 1);
      const newValue = currentPosition.value * ilFactor + feeEarned;

      // Check if strategy wants to rebalance
      const shouldRebalance = await strategy.evaluate({
        position: {
          address: new PublicKey('11111111111111111111111111111111'),
          pool: new PublicKey('11111111111111111111111111111111'),
          owner: new PublicKey('11111111111111111111111111111111'),
          liquidity: currentPosition.liquidity,
          lowerBinId: currentPosition.lowerBinId,
          upperBinId: currentPosition.upperBinId,
          lastUpdateTime: timestamp,
          healthFactor: 1,
        },
        currentPrice,
        targetPriceRange: {
          lower: binRange.lower,
          upper: binRange.upper,
        },
        rebalanceThreshold: 0.05,
        minLiquidity: initialLiquidity * 0.1,
      });

      if (shouldRebalance) {
        totalTrades++;
        // Simulate rebalancing costs
        const rebalancingCost = newValue * 0.001; // 0.1% cost
        currentPosition = {
          ...currentPosition,
          timestamp,
          value: newValue - rebalancingCost,
          lowerBinId: Math.floor(currentPrice * 0.95), // 5% range
          upperBinId: Math.ceil(currentPrice * 1.05),
        };

        if (currentPosition.value > positions[positions.length - 1]?.value) {
          successfulTrades++;
        }
      } else {
        currentPosition = {
          ...currentPosition,
          timestamp,
          value: newValue,
        };
      }

      positions.push({ ...currentPosition });
      metrics.push({
        timestamp,
        value: currentPosition.value,
      });

      // Update max/min values for drawdown calculation
      maxValue = Math.max(maxValue, currentPosition.value);
      minValue = Math.min(minValue, currentPosition.value);

      // Calculate return for this period
      returns.push((currentPosition.value - positions[positions.length - 1].value) / 
                   positions[positions.length - 1].value);
    }

    // Calculate performance metrics
    const finalValue = currentPosition.value;
    const totalReturn = (finalValue - initialLiquidity) / initialLiquidity;
    const timePeriodInYears = (endTime - startTime) / (365 * 24 * 60 * 60 * 1000);
    const apr = (totalReturn / timePeriodInYears) * 100;
    const maxDrawdown = (maxValue - minValue) / maxValue * 100;

    // Calculate volatility (standard deviation of returns)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized volatility

    // Calculate Sharpe ratio (assuming risk-free rate of 2%)
    const riskFreeRate = 0.02;
    const sharpeRatio = (apr / 100 - riskFreeRate) / (volatility / 100);

    return {
      returns: totalReturn * 100,
      apr,
      impermanentLoss: ((initialLiquidity * (1 + totalReturn)) - finalValue) / initialLiquidity * 100,
      feesEarned: totalFeesEarned,
      totalTrades,
      successfulTrades,
      maxDrawdown,
      volatility,
      sharpeRatio,
      positions,
      metrics,
    };
  }
}
