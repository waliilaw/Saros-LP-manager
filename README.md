# Saros LP Manager

A comprehensive dashboard for managing Saros DLMM liquidity positions. This application provides real-time monitoring, analytics, and automation tools for liquidity providers.

## Features

- **Position Management**
  - Create new liquidity positions
  - Adjust position parameters (price range, liquidity)
  - Monitor position health and performance
  - Real-time metrics (TVL, APR, Volume, Fees)

- **Automation Tools**
  - Automated rebalancing based on market conditions
  - Position health monitoring
  - Customizable automation strategies

- **Analytics Dashboard**
  - Performance metrics visualization
  - Historical data analysis
  - Price range utilization tracking
  - Fee earnings breakdown

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Solana wallet (e.g., Phantom)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/saros-lp-manager.git
cd saros-lp-manager
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your configuration:
```env
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=your_rpc_endpoint
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
npm start
```

## Architecture

The application is built with:
- Next.js 15+ for the frontend framework
- Saros DLMM SDK for liquidity pool interactions
- TailwindCSS for styling
- React Context for state management

Key components:
- `PositionContext`: Central state management for positions
- `PositionList`: Main component for displaying positions
- `PositionDetails`: Detailed view of a single position
- `AutomationControls`: Configuration for automated strategies
- `AnalyticsDashboard`: Performance visualization

## Usage Guide

1. **Connecting Your Wallet**
   - Click "Connect Wallet" in the top right
   - Select your Solana wallet provider
   - Approve the connection

2. **Creating a Position**
   - Click "Create Position" button
   - Select token pair
   - Set price range and amount
   - Confirm transaction in your wallet

3. **Managing Positions**
   - View all positions in the main dashboard
   - Click "Details" to see full position metrics
   - Use "Adjust" to modify position parameters
   - Monitor health indicators for each position

4. **Setting Up Automation**
   - Navigate to a position's details
   - Click "Automation Settings"
   - Enable desired strategies
   - Configure strategy parameters

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Saros DLMM SDK](https://github.com/saros-finance/dlmm-sdk)
- Inspired by the Saros Finance ecosystem
- Created for the Saros DeFi Bounty Program