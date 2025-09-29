'use client';

import { motion } from 'framer-motion';

export function DocsContent() {
  return (
    <div className="min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-container mb-8"
        >
          <div className="glass-container__background"></div>
          <div className="relative z-10 p-12">
            <h1 className="text-5xl text-gray-800 mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 900 }}>
              Documentation
            </h1>
            <p className="text-xl text-gray-700" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
              A deep dive into how this LP Manager works and how it uses the Saros DLMM SDK
            </p>
          </div>
        </motion.div>

        {/* What This Project Does */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-container mb-8"
        >
          <div className="glass-container__background"></div>
          <div className="relative z-10 p-8">
            <h2 className="text-3xl text-gray-800 mb-6" style={{ fontFamily: 'CustomFont', fontWeight: 900 }}>
              What is This Project?
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
                This is a <strong>Liquidity Position Manager</strong> for Saros Finance's DLMM (Dynamic Liquidity Market Maker) protocol on Solana. 
                Think of it as your personal assistant for managing liquidity positions in DeFi.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
                Instead of manually tracking positions across multiple pools, checking prices, and rebalancing liquidity, 
                this application does it all for you with a beautiful interface and real-time data from the Saros DLMM SDK.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 my-6">
                <p className="text-gray-800" style={{ fontFamily: 'CustomFont', fontWeight: 600 }}>
                  💡 <strong>Why This Matters:</strong> Liquidity providers lose money when their positions drift out of range or aren't properly balanced. 
                  This tool helps you maximize earnings and minimize losses.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Core Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-container mb-8"
        >
          <div className="glass-container__background"></div>
          <div className="relative z-10 p-8">
            <h2 className="text-3xl text-gray-800 mb-6" style={{ fontFamily: 'CustomFont', fontWeight: 900 }}>
              Core Features
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 border-gray-800 pl-6">
                <h3 className="text-xl text-gray-800 mb-2" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  1. Position Management
                </h3>
                <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
                  Create, adjust, and monitor liquidity positions across different DLMM pools. Each position shows you exactly 
                  how much liquidity you've provided, which price range (bins) it covers, and your current health score.
                </p>
              </div>

              <div className="border-l-4 border-gray-800 pl-6">
                <h3 className="text-xl text-gray-800 mb-2" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  2. Real-Time Analytics
                </h3>
                <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
                  See your total value locked (TVL), fees earned, 24-hour volume, APR (annual percentage rate), and impermanent loss 
                  all calculated in real-time from on-chain data via the DLMM SDK.
                </p>
              </div>

              <div className="border-l-4 border-gray-800 pl-6">
                <h3 className="text-xl text-gray-800 mb-2" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  3. Position Health Monitoring
                </h3>
                <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
                  Each position gets a health score (0-100) based on how well it's positioned relative to the current market price, 
                  utilization rate, and liquidity distribution. This helps you spot positions that need attention.
                </p>
              </div>

              <div className="border-l-4 border-gray-800 pl-6">
                <h3 className="text-xl text-gray-800 mb-2" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  4. Automated Rebalancing
                </h3>
                <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
                  Set up strategies that automatically adjust your positions when market conditions change. Choose from symmetric, 
                  dynamic, or concentrated liquidity strategies to match your risk tolerance.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* How It Uses Saros DLMM SDK */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-container mb-8"
        >
          <div className="glass-container__background"></div>
          <div className="relative z-10 p-8">
            <h2 className="text-3xl text-gray-800 mb-6" style={{ fontFamily: 'CustomFont', fontWeight: 900 }}>
              How It Uses the Saros DLMM SDK
            </h2>
            <div className="space-y-6">
              <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
                The entire application is built on top of the <code className="bg-gray-100 px-2 py-1 rounded text-sm">@saros-finance/dlmm-sdk</code> package. 
                Here's exactly how we integrate with it:
              </p>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg text-gray-800 mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  🔧 SDK Integration Points
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-md text-gray-800 mb-2 font-semibold">Creating Positions</h4>
                    <p className="text-sm text-gray-700 mb-2">When you create a position, we use:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li><code className="bg-white px-2 py-0.5 rounded">LiquidityBookServices</code> - Main SDK service class</li>
                      <li><code className="bg-white px-2 py-0.5 rounded">addLiquidity()</code> - Adds liquidity to specific bins</li>
                      <li><code className="bg-white px-2 py-0.5 rounded">fetchPoolMetadata()</code> - Gets pool information like bin step, active bin</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-md text-gray-800 mb-2 font-semibold">Fetching Position Data</h4>
                    <p className="text-sm text-gray-700 mb-2">To display your positions:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li><code className="bg-white px-2 py-0.5 rounded">getUserPositions()</code> - Fetches positions for a wallet + pool pair</li>
                      <li><code className="bg-white px-2 py-0.5 rounded">getAllPoolAddresses()</code> - Lists all available DLMM pools</li>
                      <li><code className="bg-white px-2 py-0.5 rounded">fetchBin()</code> - Gets data for specific price bins</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-md text-gray-800 mb-2 font-semibold">Calculating Metrics</h4>
                    <p className="text-sm text-gray-700 mb-2">For analytics and health scores:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li><code className="bg-white px-2 py-0.5 rounded">getQuote()</code> - Calculates price impact and expected output</li>
                      <li><code className="bg-white px-2 py-0.5 rounded">fetchPoolMetadata()</code> - Gets volume, fees, and price data</li>
                      <li>Custom calculations for APR, impermanent loss, and utilization based on SDK data</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
                <p className="text-gray-800" style={{ fontFamily: 'CustomFont', fontWeight: 600 }}>
                  ⚠️ <strong>SDK Limitation:</strong> Currently, <code className="bg-white px-2 py-0.5 rounded">getUserPositions()</code> requires 
                  knowing the pool address beforehand. There's no single method to fetch all positions across all pools for a wallet. 
                  We work around this by storing created positions locally and validating them against on-chain data.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Technical Architecture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-container mb-8"
        >
          <div className="glass-container__background"></div>
          <div className="relative z-10 p-8">
            <h2 className="text-3xl text-gray-800 mb-6" style={{ fontFamily: 'CustomFont', fontWeight: 900 }}>
              Technical Architecture
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl text-gray-800 mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  Tech Stack
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2">Frontend</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Next.js 14 (App Router)</li>
                      <li>• React 18 with TypeScript</li>
                      <li>• Tailwind CSS</li>
                      <li>• Framer Motion</li>
                    </ul>
                  </div>
                  <div className="bg-white/50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2">Blockchain</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• @saros-finance/dlmm-sdk</li>
                      <li>• @solana/web3.js</li>
                      <li>• Solana Devnet</li>
                      <li>• Wallet adapters (Phantom, etc.)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl text-gray-800 mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  Key Components
                </h3>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-gray-800 pl-6">
                    <h4 className="text-md text-gray-800 mb-2 font-semibold">DLMMService</h4>
                    <p className="text-sm text-gray-700">
                      Core service that wraps all Saros DLMM SDK calls. Handles position creation, fetching pool data, 
                      and calculating quotes. Acts as the bridge between our UI and the blockchain.
                    </p>
                  </div>

                  <div className="border-l-4 border-gray-800 pl-6">
                    <h4 className="text-md text-gray-800 mb-2 font-semibold">PositionManager</h4>
                    <p className="text-sm text-gray-700">
                      Manages all position-related logic including metrics calculation, health scoring, and tracking multiple positions. 
                      Queries the DLMM SDK for real-time data and caches it for performance.
                    </p>
                  </div>

                  <div className="border-l-4 border-gray-800 pl-6">
                    <h4 className="text-md text-gray-800 mb-2 font-semibold">PositionContext</h4>
                    <p className="text-sm text-gray-700">
                      React Context that provides position state across the entire app. Handles automatic refreshing every 30 seconds 
                      and maintains localStorage persistence for created positions.
                    </p>
                  </div>

                  <div className="border-l-4 border-gray-800 pl-6">
                    <h4 className="text-md text-gray-800 mb-2 font-semibold">AutomationManager</h4>
                    <p className="text-sm text-gray-700">
                      Implements automated rebalancing strategies. Monitors position health and executes adjustments based on 
                      predefined rules using SDK methods to add/remove liquidity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Data Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-container mb-8"
        >
          <div className="glass-container__background"></div>
          <div className="relative z-10 p-8">
            <h2 className="text-3xl text-gray-800 mb-6" style={{ fontFamily: 'CustomFont', fontWeight: 900 }}>
              How Data Flows Through the App
            </h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg text-gray-800 mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  Position Creation Flow
                </h3>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600">1.</span>
                    <span>User fills out the form with token addresses, amount, and bin range</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600">2.</span>
                    <span>We fetch a quote using <code className="bg-white px-2 py-0.5 rounded">getQuote()</code> to show expected output and price impact</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600">3.</span>
                    <span>User clicks "Create Position" - we call <code className="bg-white px-2 py-0.5 rounded">addLiquidity()</code> from the SDK</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600">4.</span>
                    <span>SDK builds a Solana transaction and requests wallet signature</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600">5.</span>
                    <span>Transaction is sent to Solana blockchain and we wait for confirmation</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600">6.</span>
                    <span>Once confirmed, we store the position details locally and add it to the UI immediately</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600">7.</span>
                    <span>Background refresh pulls real metrics from the SDK to update the position card</span>
                  </li>
                </ol>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg text-gray-800 mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  Analytics Calculation Flow
                </h3>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="font-bold text-green-600">1.</span>
                    <span>Dashboard loads and calls <code className="bg-white px-2 py-0.5 rounded">refreshPositions()</code></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-green-600">2.</span>
                    <span>For each position, we fetch pool metadata using <code className="bg-white px-2 py-0.5 rounded">fetchPoolMetadata()</code></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-green-600">3.</span>
                    <span>We query bin data to calculate liquidity distribution and utilization</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-green-600">4.</span>
                    <span>APR is calculated from fees earned and position value over time</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-green-600">5.</span>
                    <span>Health score is computed based on distance from active bin, utilization rate, and liquidity</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-green-600">6.</span>
                    <span>All metrics are displayed in real-time on the dashboard with automatic 30-second updates</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Challenges & Solutions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-container mb-8"
        >
          <div className="glass-container__background"></div>
          <div className="relative z-10 p-8">
            <h2 className="text-3xl text-gray-800 mb-6" style={{ fontFamily: 'CustomFont', fontWeight: 900 }}>
              Challenges & Solutions
            </h2>
            
            <div className="space-y-6">
              <div className="bg-red-50 border-l-4 border-red-600 p-6">
                <h3 className="text-lg text-gray-800 mb-2" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  Challenge #1: SDK requires pool address to fetch positions
                </h3>
                <p className="text-gray-700 mb-3">
                  The <code className="bg-white px-2 py-0.5 rounded">getUserPositions()</code> method requires both a wallet address AND a pool address. 
                  There's no way to get "all positions for this wallet" across all pools.
                </p>
                <p className="text-gray-800" style={{ fontFamily: 'CustomFont', fontWeight: 600 }}>
                  ✅ Solution: When a position is created, we store it in localStorage with the pool address. This lets us query the SDK 
                  for each known position and validate it against on-chain data. It's a hybrid approach that works with the SDK's current capabilities.
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-600 p-6">
                <h3 className="text-lg text-gray-800 mb-2" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  Challenge #2: Next.js SSR vs Client-only SDK
                </h3>
                <p className="text-gray-700 mb-3">
                  The Saros SDK and Solana wallet adapters only work in the browser, but Next.js tries to render everything on the server first.
                </p>
                <p className="text-gray-800" style={{ fontFamily: 'CustomFont', fontWeight: 600 }}>
                  ✅ Solution: Created separate client-side wrappers and used the <code className="bg-white px-2 py-0.5 rounded">'use client'</code> directive. 
                  Added <code className="bg-white px-2 py-0.5 rounded">isClient</code> checks to ensure SDK calls only happen after hydration.
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-600 p-6">
                <h3 className="text-lg text-gray-800 mb-2" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  Challenge #3: Devnet pool discovery
                </h3>
                <p className="text-gray-700 mb-3">
                  Finding available pools on devnet was difficult - no UI exists and the team is still building out devnet support.
                </p>
                <p className="text-gray-800" style={{ fontFamily: 'CustomFont', fontWeight: 600 }}>
                  ✅ Solution: Used <code className="bg-white px-2 py-0.5 rounded">getAllPoolAddresses()</code> from the SDK and added a "Load Pools" 
                  button that lets users discover available pools dynamically.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Future Improvements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-container"
        >
          <div className="glass-container__background"></div>
          <div className="relative z-10 p-8">
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg text-gray-800 mb-3" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                💡 Built for the Ecosystem
              </h3>
              <p className="text-gray-700">
                This project serves as a foundation that other developers can learn from and build upon. All code is open-source, 
                well-documented, and demonstrates real-world SDK usage patterns that solve actual problems in the Saros ecosystem.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
