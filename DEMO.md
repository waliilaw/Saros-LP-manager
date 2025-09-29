# Saros LP Manager - Demo Guide

This guide demonstrates the key features of the Saros LP Manager application.

## Key Features

### 1. Position Management
- Create and adjust liquidity positions
- Real-time position monitoring
- Health score tracking
- Performance analytics

### 2. Limit Orders
- Place limit orders using DLMM bins
- Automatic order execution
- Order tracking and management
- Efficient order cancellation

### 3. Automated Rebalancing
- Multiple rebalancing strategies
- Real-time market monitoring
- Volatility-based adjustments
- Gas-efficient rebalancing

### 4. Real-Time Analytics
- Position performance tracking
- Fee earnings monitoring
- Impermanent loss calculation
- Price range analysis

## Quick Start Demo

1. **Connect Wallet**
   ```
   Click "Connect Wallet" button
   Select Phantom
   Approve connection
   ```

2. **Create Position**
   ```
   Navigate to "Setup"
   Select SOL/USDC pair
   Set range: -10 to +10 bins
   Amount: 100 SOL
   Click "Create Position"
   ```

3. **Enable Rebalancing**
   ```
   Select Dynamic Strategy
   Target Utilization: 80%
   Rebalance Threshold: 3 bins
   Apply Strategy
   ```

4. **Place Limit Order**
   ```
   Select Buy Order
   Amount: 100 USDC
   Target Price: 80 SOL/USDC
   Place Order
   ```

5. **Monitor Performance**
   ```
   Check Dashboard
   View Health Score
   Track Fee Earnings
   Monitor Price Movement
   ```

## Strategy Examples

### Symmetric Strategy
```typescript
{
  type: 'symmetric',
  targetUtilization: 80,
  rebalanceThreshold: 3,
  minBinSpread: 5,
  maxBinSpread: 20
}
```

### Dynamic Strategy
```typescript
{
  type: 'dynamic',
  targetUtilization: 80,
  rebalanceThreshold: 3,
  minBinSpread: 5,
  maxBinSpread: 20
}
```

### Concentrated Strategy
```typescript
{
  type: 'concentrated',
  targetUtilization: 80,
  rebalanceThreshold: 3,
  minBinSpread: 5,
  maxBinSpread: 20,
  concentrationFactor: 2
}
```

## Best Practices

1. **Position Management**
   - Start small
   - Monitor regularly
   - Adjust based on performance

2. **Risk Control**
   - Set stop-loss levels
   - Monitor health scores
   - Diversify positions

3. **Strategy Optimization**
   - Back-test strategies
   - Start conservative
   - Adjust based on data

## Support

- Discord: https://discord.gg/saros
- Docs: /docs
- Issues: GitHub Issues