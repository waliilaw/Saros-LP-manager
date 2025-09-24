import { PublicKey } from '@solana/web3.js';
import { SarosDLMMService } from '../dlmm-service';
import { IDLMMPosition } from '../interfaces';

export interface RebalanceParams {
  position: IDLMMPosition;
  currentPrice: number;
  targetPriceRange: {
    lower: number;
    upper: number;
  };
  rebalanceThreshold: number; // Percentage deviation that triggers rebalancing
  minLiquidity: number; // Minimum liquidity to maintain
}

export interface IRebalancingStrategy {
  name: string;
  description: string;
  evaluate(params: RebalanceParams): Promise<boolean>;
  execute(params: RebalanceParams): Promise<boolean>;
}

export class DynamicRangeStrategy implements IRebalancingStrategy {
  name = 'Dynamic Range Strategy';
  description = 'Automatically adjusts position range based on price movements and volatility';

  constructor(private dlmmService: SarosDLMMService) {}

  private calculateOptimalRange(currentPrice: number, volatility: number): { lower: number; upper: number } {
    // Calculate optimal range based on historical volatility
    const range = currentPrice * (volatility / 100);
    return {
      lower: currentPrice - range,
      upper: currentPrice + range,
    };
  }

  private async getHistoricalVolatility(tokenAddress: PublicKey): Promise<number> {
    // TODO: Implement volatility calculation using price history
    // For now, return a mock value
    return 5; // 5% volatility
  }

  async evaluate({ position, currentPrice, rebalanceThreshold }: RebalanceParams): Promise<boolean> {
    const volatility = await this.getHistoricalVolatility(position.pool);
    const optimalRange = this.calculateOptimalRange(currentPrice, volatility);
    
    // Check if current position is outside optimal range by threshold
    const lowerDeviation = Math.abs((position.lowerBinId - optimalRange.lower) / optimalRange.lower);
    const upperDeviation = Math.abs((position.upperBinId - optimalRange.upper) / optimalRange.upper);
    
    return lowerDeviation > rebalanceThreshold || upperDeviation > rebalanceThreshold;
  }

  async execute({ position, currentPrice }: RebalanceParams): Promise<boolean> {
    try {
      const volatility = await this.getHistoricalVolatility(position.pool);
      const optimalRange = this.calculateOptimalRange(currentPrice, volatility);

      // Adjust position to new optimal range
      const success = await this.dlmmService.adjustPosition({
        position,
        newLowerBinId: Math.floor(optimalRange.lower),
        newUpperBinId: Math.ceil(optimalRange.upper),
      });

      return success;
    } catch (error) {
      console.error('Failed to execute rebalancing strategy:', error);
      return false;
    }
  }
}

export class VolatilityHarvestingStrategy implements IRebalancingStrategy {
  name = 'Volatility Harvesting Strategy';
  description = 'Capitalizes on high volatility periods by widening ranges and increasing liquidity';

  constructor(private dlmmService: SarosDLMMService) {}

  private async getMarketConditions(tokenAddress: PublicKey): Promise<{ volatility: number; trend: number }> {
    // TODO: Implement market analysis
    // For now, return mock values
    return {
      volatility: 8, // 8% volatility
      trend: 0.5, // Slight upward trend
    };
  }

  async evaluate({ position, currentPrice, rebalanceThreshold }: RebalanceParams): Promise<boolean> {
    const { volatility, trend } = await this.getMarketConditions(position.pool);
    
    // Evaluate if market conditions warrant strategy adjustment
    const volatilityThreshold = rebalanceThreshold * 1.5;
    const trendStrength = Math.abs(trend);
    
    return volatility > volatilityThreshold || trendStrength > rebalanceThreshold;
  }

  async execute({ position, currentPrice, minLiquidity }: RebalanceParams): Promise<boolean> {
    try {
      const { volatility, trend } = await this.getMarketConditions(position.pool);
      
      // Calculate new range based on volatility and trend
      const rangeWidth = currentPrice * (volatility / 100) * (1 + Math.abs(trend));
      const rangeMidpoint = currentPrice * (1 + trend * 0.5);
      
      const newRange = {
        lower: rangeMidpoint - rangeWidth,
        upper: rangeMidpoint + rangeWidth,
      };

      // Adjust position with new range and potentially increased liquidity
      const success = await this.dlmmService.adjustPosition({
        position,
        newLowerBinId: Math.floor(newRange.lower),
        newUpperBinId: Math.ceil(newRange.upper),
        addAmount: minLiquidity * (volatility / 100), // Add more liquidity in high volatility
      });

      return success;
    } catch (error) {
      console.error('Failed to execute volatility harvesting strategy:', error);
      return false;
    }
  }
}