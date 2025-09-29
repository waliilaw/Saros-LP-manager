export interface PoolMetadata {
  binStep: number;
  activeId: number;
  volume24h?: number;
  priceChange24h?: number;
  [key: string]: any;
}

export interface Bin {
  liquidity: number;
  amountX: number;
  amountY: number;
  volume24h?: number;
  fees?: number;
  [key: string]: any;
}

export interface IRebalancingStrategy {
  id: string;
  name: string;
  description: string;
  type: 'symmetric' | 'dynamic' | 'concentrated';
  targetUtilization: number;
  rebalanceThreshold: number;
  minBinSpread: number;
  maxBinSpread: number;
  concentrationFactor?: number;
  minRebalanceInterval?: number;
  maxGasPrice?: number;
  slippageTolerance?: number;
  checkAndExecute: (position: any, metrics: any) => Promise<void>;
}

export interface PositionState {
  id: string;
  lowerBinId: number;
  upperBinId: number;
  liquidity: number;
  lastRebalance: number;
  healthScore: number;
}