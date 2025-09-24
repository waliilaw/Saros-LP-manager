# API Documentation

## Core Services

### SarosDLMMService

The main service for interacting with Saros DLMM protocol.

#### Methods

##### `createPosition`
Creates a new liquidity position.

```typescript
async function createPosition(params: {
  tokenA: string;
  tokenB: string;
  lowerBinId: number;
  upperBinId: number;
  amount: number;
  isTokenA: boolean;
}): Promise<Position>
```

##### `adjustPosition`
Adjusts an existing position's parameters.

```typescript
async function adjustPosition(params: {
  position: Position;
  newLowerBinId?: number;
  newUpperBinId?: number;
  addAmount?: number;
  removeAmount?: number;
}): Promise<boolean>
```

##### `getPosition`
Retrieves position details.

```typescript
async function getPosition(positionId: string): Promise<Position>
```

### PositionManager

Manages position operations and state.

#### Methods

##### `getPositions`
Retrieves all positions for the current user.

```typescript
async function getPositions(): Promise<Position[]>
```

##### `getMetrics`
Calculates position metrics.

```typescript
async function getMetrics(positionId: string): Promise<PositionMetrics>
```

### AutomationManager

Manages automated strategies.

#### Methods

##### `registerStrategy`
Registers a new automation strategy.

```typescript
function registerStrategy(strategy: IRebalancingStrategy): void
```

##### `activateStrategy`
Activates a strategy for a position.

```typescript
async function activateStrategy(
  positionId: string,
  strategyName: string,
  params: RebalanceParams
): Promise<boolean>
```

## Data Types

### Position

```typescript
interface Position {
  address: PublicKey;
  pool: PublicKey;
  owner: PublicKey;
  liquidity: number;
  lowerBinId: number;
  upperBinId: number;
  lastUpdateTime: number;
  healthFactor: number;
}
```

### PositionMetrics

```typescript
interface PositionMetrics {
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
```

### Strategy

```typescript
interface IRebalancingStrategy {
  name: string;
  description: string;
  evaluate(params: RebalanceParams): Promise<boolean>;
  execute(params: RebalanceParams): Promise<boolean>;
}
```

## Error Handling

### Error Types

```typescript
enum ErrorCode {
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  POSITION_NOT_FOUND = 'POSITION_NOT_FOUND',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: any;
}
```

### Error Examples

```typescript
// Invalid parameters
{
  code: 'INVALID_PARAMETERS',
  message: 'Invalid bin range specified',
  details: {
    lowerBinId: 100,
    upperBinId: 90,
    reason: 'Lower bin ID must be less than upper bin ID'
  }
}

// Transaction failure
{
  code: 'TRANSACTION_FAILED',
  message: 'Failed to execute transaction',
  details: {
    txHash: '...',
    error: 'Insufficient funds for gas'
  }
}
```

## Rate Limits

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| Position Creation | 10 | 1 minute |
| Position Adjustment | 20 | 1 minute |
| Position Queries | 100 | 1 minute |
| Price Feeds | 1000 | 1 minute |

## WebSocket API

### Price Feed Subscription

```typescript
// Subscribe to price updates
ws.send(JSON.stringify({
  type: 'SUBSCRIBE',
  channel: 'PRICE_FEED',
  symbols: ['SOL/USDC', 'ETH/USDC']
}));

// Price update message
{
  type: 'PRICE_UPDATE',
  symbol: 'SOL/USDC',
  price: 100.50,
  timestamp: 1632150400000
}
```

### Position Updates

```typescript
// Subscribe to position updates
ws.send(JSON.stringify({
  type: 'SUBSCRIBE',
  channel: 'POSITION_UPDATES',
  positions: ['position1', 'position2']
}));

// Position update message
{
  type: 'POSITION_UPDATE',
  positionId: 'position1',
  metrics: {
    feesEarned: 100,
    volume24h: 50000,
    apr: 0.15
  },
  timestamp: 1632150400000
}
```

## Examples

### Creating a Position

```typescript
const position = await dlmmService.createPosition({
  tokenA: 'SOL',
  tokenB: 'USDC',
  lowerBinId: 90,
  upperBinId: 110,
  amount: 1000,
  isTokenA: true
});

console.log('Position created:', position.address.toString());
```

### Implementing a Custom Strategy

```typescript
class CustomStrategy implements IRebalancingStrategy {
  name = 'Custom Range Strategy';
  description = 'Adjusts range based on custom logic';

  async evaluate(params: RebalanceParams): Promise<boolean> {
    const { position, currentPrice } = params;
    const priceDeviation = Math.abs(currentPrice - position.targetPrice);
    return priceDeviation > params.rebalanceThreshold;
  }

  async execute(params: RebalanceParams): Promise<boolean> {
    // Custom rebalancing logic
    return true;
  }
}
```

### Error Handling Example

```typescript
try {
  await dlmmService.adjustPosition({
    position,
    newLowerBinId: 95,
    newUpperBinId: 105
  });
} catch (error) {
  if (error.code === ErrorCode.INSUFFICIENT_FUNDS) {
    // Handle insufficient funds
  } else if (error.code === ErrorCode.INVALID_PARAMETERS) {
    // Handle invalid parameters
  } else {
    // Handle other errors
  }
}
```
