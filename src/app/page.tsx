'use client';

import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="glass-container mb-12"
        >
          <div className="glass-container__background"></div>
          <div className="relative z-10 p-12 text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl text-gray-800 mb-8" style={{ fontFamily: 'CustomFont', fontWeight: 900 }}>
              Saros LP Manager
            </h1>
            <p className="text-2xl md:text-3xl text-gray-800 mb-6 max-w-4xl mx-auto leading-relaxed" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
              Advanced liquidity management tools for DeFi markets on Solana
            </p>
            <p className="text-lg text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
              A production-ready demo application showcasing the power of Saros DLMM SDK with real-world use cases for liquidity providers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/dashboard"
                className="btn-secondary text-center text-lg px-6 py-2"
              >
                Launch Dashboard
              </a>
              <a
                href="/setup"
                className="btn-secondary text-center text-lg px-6 py-2"
              >
                Setup & Testing
              </a>
              <a
                href="/docs"
                className="btn-secondary text-center text-lg px-6 py-2"
              >
                Detailed Docs
              </a>
            </div>
          </div>
        </motion.div>

        {/* What This Project Does */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="glass-container mb-12"
        >
          <div className="glass-container__background"></div>
          <div className="relative z-10 p-10">
            <h2 className="text-3xl text-gray-800 mb-6 text-center" style={{ fontFamily: 'CustomFont', fontWeight: 900 }}>
              What Does This Application Do?
            </h2>
            <div className="max-w-4xl mx-auto text-gray-800 space-y-4" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
              <p className="text-lg leading-relaxed">
                This LP Manager helps you manage your liquidity positions on Saros Finance with ease. Think of it as your personal assistant for making money in DeFi - it watches your investments, tells you how they're performing, and can even automatically adjust them to maximize your profits.
              </p>
              <p className="text-lg leading-relaxed">
                Instead of manually checking prices and moving your liquidity around (which costs gas fees and takes time), this tool does it for you. It's like having a smart robot that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg pl-4">
                <li>Monitors your positions 24/7 and shows you real-time analytics</li>
                <li>Automatically rebalances your liquidity when market conditions change</li>
                <li>Lets you set up advanced trading strategies like limit orders and stop losses</li>
                <li>Tracks your earnings, fees, and overall portfolio health</li>
                <li>Alerts you when something needs your attention</li>
              </ul>
              <p className="text-lg leading-relaxed">
                Perfect for both beginners who want a simple dashboard and advanced traders who need sophisticated automation tools.
              </p>

              {/* Video Demo Section */}
              <div className="mt-8">
                <h3 className="text-xl text-gray-800 mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  Watch Demo Video
                </h3>
                <div className="relative rounded-2xl overflow-hidden border-2 border-gray-300 bg-gray-100" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/T5s8okMnvVU?si=VeHpWwoIRKjFmgxF"
                    title="Saros LP Manager Demo"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  See how the LP Manager works in action - from creating positions to monitoring analytics
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Features - 3 Column Grid */}
      

        {/* Technical Implementation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="glass-container mb-12"
        >
          <div className="glass-container__background"></div>
          <div className="relative z-10 p-10">
            <h2 className="text-3xl text-gray-800 mb-8 text-center" style={{ fontFamily: 'CustomFont', fontWeight: 900 }}>
              Built with Saros DLMM SDK
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div>
                <h3 className="text-xl text-gray-800 mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  ✅ SDK Integration
                </h3>
                <ul className="space-y-2 text-gray-800" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
                  <li>• Full @saros-finance/dlmm-sdk integration</li>
                  <li>• Real-time pool metadata and bin data</li>
                  <li>• Position creation and adjustment via SDK</li>
                  <li>• Live price feeds from DLMM pools</li>
                  <li>• Transaction signing with Solana wallets</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl text-gray-800 mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                  ✅ Production Features
                </h3>
                <ul className="space-y-2 text-gray-800" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
                  <li>• Clean, type-safe TypeScript codebase</li>
                  <li>• Comprehensive error handling</li>
                  <li>• Responsive UI with smooth animations</li>
                  <li>• Real-world applicability for LPs</li>
                  <li>• Detailed documentation and comments</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

       

            </div>
        </div>
    );
}