
# Saros LP Manager

<img width="1921" height="1081" alt="rwui9f8nciazv4bgopb5" src="https://github.com/user-attachments/assets/6d699b43-21ef-46f4-94d0-cd275f4c9bca" />

A sophisticated liquidity management application built on top of the Saros DLMM SDK, providing advanced features for liquidity providers.

## Features

### 1. Advanced Position Management
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
- Multiple rebalancing strategies:
  - Symmetric: Equal distribution around active bin
  - Dynamic: Adjusts based on volatility
  - Concentrated: Focuses liquidity near active bin
- Real-time market monitoring
- Volatility-based adjustments
- Gas-efficient rebalancing

### 4. Real-Time Analytics
- Position performance tracking
- Fee earnings monitoring
- Impermanent loss calculation
- Price range analysis
- Volume and liquidity metrics

### 5. Professional UI/UX
- Clean and modern interface
- Real-time updates
- Interactive charts
- Responsive design
- Smooth animations

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- A Solana wallet (e.g., Phantom)
- **A reliable RPC endpoint** (see Configuration below)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/saros-lp-manager.git

# Install dependencies
cd saros-lp-manager
npm install

# Start development server
npm run dev
```

### ⚠️ Configuration (IMPORTANT)

**The public Solana RPC is often unavailable!** You'll see 503 errors and features won't work.

**Solution**: Get a free RPC API key from [Helius](https://www.helius.dev/), [QuickNode](https://www.quicknode.com/), or [Alchemy](https://www.alchemy.com/).

Create a `.env.local` file:
```env
# Example with Helius (recommended - 100k requests/day free)
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

**📖 See [RPC_SETUP.md](RPC_SETUP.md) for detailed instructions.**

## Usage

### 1. Connect Wallet
1. Click "Connect Wallet" button
2. Select your Solana wallet
3. Approve the connection

### 2. Create Position
1. Navigate to "Setup"
2. Select token pair
3. Set position parameters
4. Confirm transaction

### 3. Manage Positions
1. View positions in dashboard
2. Monitor health scores
3. Adjust positions as needed
4. Track performance

### 4. Place Limit Orders
1. Select token pair
2. Set target price
3. Enter amount
4. Place order

### 5. Configure Rebalancing
1. Choose strategy
2. Set parameters
3. Enable automation
4. Monitor adjustments

## Architecture

The application is built using:
- Next.js 14
- React 18
- TypeScript
- Saros DLMM SDK
- Framer Motion
- TailwindCSS

For detailed technical information, see:
- [Technical Documentation](docs/TECHNICAL.md)
- [API Documentation](docs/API.md)

## Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request


## Support

- [Documentation](docs/)
- [Issue Tracker](https://github.com/waliilaww/saros-lp-manager/issues)
- [Discord Community](https://discord.gg/saros)

## Acknowledgments

- Saros Finance Team
- Solana Foundation
- Open Source Contributors
