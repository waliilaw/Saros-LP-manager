# Saros DLMM Liquidity Position Manager

a complete web application for managing liquidity positions on solana using the saros finance dlmm sdk. this project demonstrates real blockchain integration with professional ui/ux for creating and managing dynamic liquidity market maker positions on solana devnet.

## What This Project Does

this application lets users connect their phantom wallet and create actual liquidity positions on solana devnet using the saros dlmm protocol. when you create a position through this app, it executes real blockchain transactions and creates actual positions that you can see on solana explorer.

the core functionality includes:
• connecting phantom wallet to solana devnet
• browsing available dlmm pools from saros finance
• creating new liquidity positions with real transactions
• adjusting existing positions by adding or removing liquidity
• monitoring network status and connection health in real time
• viewing transaction confirmations with links to solana explorer

## Key Features

### Real Blockchain Integration
• uses the official saros finance dlmm sdk for all position operations
• executes actual transactions on solana devnet (program id: 1qbkdrr3z4ryLA7pZykqxvxWPoeifcVKo6ZG9CfkvVE)
• connects to phantom wallet for transaction signing
• provides real network latency monitoring and connection status

### Position Management
• create new liquidity positions with custom parameters
• adjust existing positions by adding or removing liquidity
• select from available dlmm pools with real pool data
• preview position details before executing transactions

### Professional User Experience  
• clean, intuitive interface built with next.js and tailwind css
• smooth animations and transitions using framer motion
• comprehensive error handling and user feedback
• responsive design that works on desktop and mobile
• real time transaction status with success/error notifications

### Developer Friendly
• full typescript implementation with proper type safety
• modular architecture with clear separation of concerns
• comprehensive error handling throughout the application
• production ready build process with no blocking errors
• proper server side rendering with hydration protection

## Project Structure

the codebase is organized into several key directories:

### `src/lib/saros/`
contains the core integration with the saros dlmm sdk:

• `dlmm-service.ts` main service class that wraps the saros sdk and provides methods for creating positions, adjusting liquidity, and fetching pool data
• `config.ts` network configuration including rpc endpoints and program ids
• `interfaces.ts` typescript interfaces that define the data structures used throughout the app
• `position-manager.ts` handles position lifecycle management and coordination
• `types.ts` type definitions specific to saros dlmm operations

the automation and price feed subdirectories contain supporting services for advanced features like automated rebalancing strategies and real time price monitoring.

### `src/context/`
react context providers that manage global application state:

• `WalletContext.tsx` manages phantom wallet connection, provides wallet state and transaction signing capabilities
• `PositionContext.tsx` handles global position state including the currently selected pool and user positions

### `src/components/`
organized ui components split by functionality:

• `position/` components for creating and managing positions including the main creation form and position details
• `dashboard/` analytics dashboard that displays position metrics and performance charts
• `common/` shared components like wallet connection button and network status indicator
• `charts/` data visualization components for showing position performance over time

### `src/app/`
next.js app router pages and layouts:

• `layout.tsx` root layout that provides the main application shell with header and navigation
• `dashboard/` main dashboard view showing user positions and analytics
• `setup/` position creation flow where users can create new liquidity positions

### `src/hooks/`
custom react hooks for specific functionality:

• `usePositionMetrics.ts` hook for calculating and tracking position performance metrics
• `usePriceFeed.ts` manages real time price data for tokens
• `usePerformanceMonitor.ts` tracks application performance and user interactions

## Technical Implementation

### SDK Integration
the application uses the official `@saros-finance/dlmm-sdk` package to interact with the saros protocol. the main integration happens in `dlmm-service.ts` which creates a `LiquidityBookServices` instance configured for devnet operation.

when creating positions, the service:
1. fetches available pool addresses from the saros protocol
2. retrieves pool metadata including bin arrays and liquidity distribution  
3. calculates optimal bin placement based on user parameters
4. builds the transaction using the sdk's position creation methods
5. sends the transaction to the user's wallet for signing
6. confirms the transaction and returns the signature for verification

### Wallet Integration
wallet functionality is handled through the `WalletContext` which wraps phantom wallet adapter. this provides:
• automatic wallet detection and connection
• transaction signing capabilities
• wallet state management across the application
• connection persistence between sessions

### State Management
the application uses react context for global state management. the `PositionContext` coordinates between the wallet and dlmm service to:
• track the currently selected pool
• manage user positions and their associated metrics
• handle loading states and error conditions
• provide methods for position creation and adjustment

### Error Handling
comprehensive error handling is implemented throughout:
• network connectivity issues are caught and displayed to users
• transaction failures provide clear error messages
• wallet connection problems are handled gracefully
• invalid input is validated before sending transactions

## Getting Started

### Prerequisites
• node.js version 18 or higher
• phantom wallet browser extension
• some sol on solana devnet for transaction fees

### Installation
1. clone this repository to your local machine
2. run `npm install` to install all dependencies
3. run `npm run dev` to start the development server
4. open your browser to `http://localhost:3000`

### Using the Application
1. connect your phantom wallet using the connect button in the header
2. navigate to the dashboard to see your existing positions (if any)
3. click "create position" to start the position creation flow
4. select a pool, set your liquidity parameters, and confirm the transaction
5. view your new position in the dashboard and track its performance

## Development Notes

this project was built with a focus on real world usability rather than just demonstrating sdk integration. the code quality follows production standards with proper typescript usage, error handling, and user experience considerations.

the architecture is designed to be extensible so additional features like automated rebalancing, advanced order types, or portfolio analytics can be easily added in the future.

while some supporting features like detailed position metrics use simplified implementations to focus development time on the core sdk integration, all the main functionality involving position creation and management uses real blockchain operations.

## Live Demo

the application is deployed and accessible at [deployment url will be added]

you can test the full functionality including wallet connection and position creation using solana devnet which provides free test sol for transaction fees.