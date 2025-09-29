# Saros LP Manager - API Documentation

## Core Services

### DLMM Service

The DLMM Service provides the core functionality for interacting with Saros DLMM pools.

#### Position Management

```typescript
interface CreatePositionParams {
  selectedPool: string;
  tokenA: string;
  tokenB: string;
  lowerBinId: number;
  upperBinId: number;
  amount: number;
  isTokenA: boolean;
  payer: string;
  signAndSendTransaction: (tx: Transaction) => Promise<string>;
}

interface AdjustPositionParams {
  position: {
    positionMint?: string;
    address?: string;
    pair: string;
    tokenA?: string;
    tokenB?: string;
    lowerBinId?: number;
    upperBinId?: number;
  };
  newLowerBinId?: number;
  newUpperBinId?: number;
  addAmount?: number;
  removeAmount?: number;
  payer: string;
  signAndSendTransaction: (tx: Transaction) => Promise<string>;
}
```

#### Methods

```typescript
class SarosDLMMService {
  async createPosition(params: CreatePositionParams): Promise<{
    signature: string;
    positionMint: string;
    address: PublicKey;
  }>;

  async adjustPosition(params: AdjustPositionParams): Promise<{
    success: boolean;
    signatures: string[];
  }>;

  async getPosition(positionId: string): Promise<any>;
  
  async getPoolMetadata(poolId: string): Promise<any>;
  
  async getUserPositions(params: { payer: string; pair: string }): Promise<any[]>;
  
  async fetchPoolAddresses(): Promise<string[]>;
  
  async getQuote(params: {
    pair: string;
    tokenBase: string;
    tokenQuote: string;
    amount: bigint;
    swapForY: boolean;
    isExactInput: boolean;
    tokenBaseDecimal: number;
    tokenQuoteDecimal: number;
    slippage: number;
  }): Promise<any>;
}
```

### Price Feed Service

Real-time price monitoring and historical data.

```typescript
interface PriceData {
  price: number;
  timestamp: number;
  volume24h: number;
  change24h: number;
  bid: number;
  ask: number;
  binId: number;
  binStep: number;
  liquidity: number;
}

class PriceFeedService {
  async connect(): Promise<void>;
  
  async subscribe(poolAddress: string, callback: (price: PriceData) => void): Promise<() => void>;
  
  async getPrice(poolAddress: string): Promise<PriceData | null>;
  
  async getHistoricalPrices(
    poolAddress: string,
    startTime: number,
    endTime: number,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
  ): Promise<TimeSeriesData[]>;
  
  async getAggregatedPrice(poolAddress: string): Promise<number | null>;
  
  disconnect(): void;
}
```

### Limit Orders Service

Advanced order types using DLMM bins.

```typescript
interface LimitOrderParams {
  poolAddress: string;
  tokenA: string;
  tokenB: string;
  amount: number;
  targetPrice: number;
  isTokenA: boolean;
  isBuy: boolean;
  payer: string;
  signAndSendTransaction: (tx: Transaction) => Promise<string>;
}

interface LimitOrder {
  id: string;
  poolAddress: string;
  tokenA: string;
  tokenB: string;
  amount: number;
  targetPrice: number;
  isTokenA: boolean;
  isBuy: boolean;
  binId: number;
  status: 'pending' | 'filled' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

class LimitOrderService {
  async createLimitOrder(params: LimitOrderParams): Promise<LimitOrder>;
  
  async cancelLimitOrder(params: {
    orderId: string;
    payer: string;
    signAndSendTransaction: (tx: Transaction) => Promise<string>;
  }): Promise<boolean>;
  
  async getLimitOrder(orderId: string): Promise<LimitOrder | null>;
  
  async getUserLimitOrders(params: {
    payer: string;
    poolAddress: string;
  }): Promise<LimitOrder[]>;
}
```

### Rebalancing Service

Automated position management with multiple strategies.

```typescript
interface RebalanceStrategy {
  type: 'symmetric' | 'dynamic' | 'concentrated';
  targetUtilization: number;
  rebalanceThreshold: number;
  minBinSpread: number;
  maxBinSpread: number;
  concentrationFactor?: number;
}

interface RebalanceParams {
  poolAddress: string;
  positionId: string;
  strategy: RebalanceStrategy;
  payer: string;
  signAndSendTransaction: (tx: Transaction) => Promise<string>;
}

class RebalancingService {
  async checkRebalanceNeeded(params: {
    poolAddress: string;
    positionId: string;
    strategy: RebalanceStrategy;
  }): Promise<{
    needed: boolean;
    reason?: string;
    suggestedBins?: { lower: number; upper: number };
  }>;

  async rebalancePosition(params: RebalanceParams): Promise<{
    success: boolean;
    newLowerBinId: number;
    newUpperBinId: number;
    signature?: string;
    error?: string;
  }>;
}
```

### Position Metrics Service

Real-time position analytics and health monitoring.

```typescript
interface IPositionMetrics {
  feesEarned: number;
  volume24h: number;
  apr: number;
  impermanentLoss: number;
  priceRange: {
    lower: number;
    upper: number;
  };
  utilization: number;
  healthScore: number;
}

class PositionMetricsService {
  static calculateImpermanentLoss(
    initialPrice: number,
    currentPrice: number,
    positionValueAtEntry: number
  ): number;

  static async calculatePositionValue(
    position: IDLMMPosition,
    currentPriceX: number
  ): Promise<number>;

  static async calculateFeesEarned(
    position: IDLMMPosition,
    currentPriceX: number,
    timeframe: number = 24
  ): Promise<{ total: number; hourly: number }>;

  static async calculateUtilization(
    position: IDLMMPosition,
    poolAddress: string
  ): Promise<number>;

  static async calculateHealthScore(
    position: IDLMMPosition,
    poolAddress: string,
    currentPrice: number
  ): Promise<number>;

  static async getMetrics(
    position: IDLMMPosition,
    poolAddress: string,
    currentPrice: number,
    timeframe: number = 24
  ): Promise<IPositionMetrics>;
}
```

## React Components

### Position Management

```typescript
<CreatePositionForm
  onSuccess?: (order: LimitOrder) => void;
  onError?: (error: Error) => void;
/>

<LimitOrderForm
  poolAddress: string;
  tokenA: string;
  tokenB: string;
  currentPrice: number;
  onSuccess?: (order: LimitOrder) => void;
  onError?: (error: Error) => void;
/>

<RebalanceStrategyForm
  poolAddress: string;
  positionId: string;
  onSuccess?: (result: RebalanceResult) => void;
  onError?: (error: Error) => void;
/>
```

### Analytics

```typescript
<PerformanceChart
  data: TimeSeriesData[];
  title: string;
  yAxisFormat: (value: number) => string;
/>

<AnalyticsDashboard />

<PositionHealthPanel
  position: IDLMMPosition;
  metrics: IPositionMetrics;
/>
```

## Context Providers

```typescript
<PositionProvider>
  {/* Provides position management context */}
</PositionProvider>

<WalletProvider>
  {/* Provides wallet connection context */}
</WalletProvider>

<SSRSafeWalletProvider>
  {/* SSR-safe wallet provider */}
</SSRSafeWalletProvider>
```

## Hooks

```typescript
const { positions, positionMetrics, loading, error } = usePositions();
const { publicKey, connected, signAndSendTransaction } = useWallet();
const { prices, subscribe } = usePriceFeed(poolAddress);
const { metrics } = usePositionMetrics(position);
```

## Error Handling

All services implement comprehensive error handling:

```typescript
try {
  // Operation
} catch (error) {
  throw new Error(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
```

## Type Safety

The application uses TypeScript throughout with proper type definitions:

```typescript
interface PoolMetadata {
  binStep: number;
  activeId: number;
  volume24h?: number;
  priceChange24h?: number;
  [key: string]: any;
}

interface Bin {
  liquidity: number;
  amountX: number;
  amountY: number;
  volume24h?: number;
  fees?: number;
  [key: string]: any;
}
```

## Best Practices

1. **Error Handling**
   - All operations include proper error handling
   - User-friendly error messages
   - Error recovery mechanisms

2. **Type Safety**
   - Comprehensive TypeScript types
   - Runtime type checking
   - Type guards where needed

3. **Performance**
   - Efficient data caching
   - Batch operations
   - Optimized re-renders

4. **Security**
   - Transaction validation
   - Input sanitization
   - Proper error boundaries