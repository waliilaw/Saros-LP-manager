'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { usePositions } from '@/context/PositionContext';
import { BacktestEngine, BacktestParams, BacktestResult } from '@/lib/saros/backtesting/engine';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils';
import { PerformanceChart } from '../charts/PerformanceChart';

const backtestEngine = new BacktestEngine();

export const BacktestPanel: React.FC = () => {
  const { automationManager, priceFeedService } = usePositions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  // Form state
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [initialLiquidity, setInitialLiquidity] = useState(10000);
  const [timeRange, setTimeRange] = useState(30); // days
  const [binRange, setBinRange] = useState({ lower: -5, upper: 5 }); // percentage
  const [fees, setFees] = useState({ swapFee: 0.003, hostFee: 0.1 }); // 0.3% swap fee, 10% host fee

  const handleRunBacktest = async () => {
    setLoading(true);
    try {
      const strategy = automationManager.strategies.find(s => s.name === selectedStrategy);
      if (!strategy) throw new Error('Strategy not found');

      const endTime = Date.now();
      const startTime = endTime - (timeRange * 24 * 60 * 60 * 1000);

      // Get historical price data
      const priceData = await priceFeedService.getHistoricalPrices(startTime, endTime);

      const params: BacktestParams = {
        startTime,
        endTime,
        initialLiquidity,
        strategy,
        priceData,
        binRange: {
          lower: Math.floor(priceData[0].value * (1 + binRange.lower / 100)),
          upper: Math.ceil(priceData[0].value * (1 + binRange.upper / 100)),
        },
        fees,
      };

      const result = await backtestEngine.runBacktest(params);
      setResult(result);
    } catch (error) {
      console.error('Backtesting failed:', error);
      // TODO: Show error notification
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md p-8 border border-gray-100"
      >
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
          Strategy Backtesting
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strategy
            </label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a strategy...</option>
              {automationManager.strategies.map((strategy) => (
                <option key={strategy.name} value={strategy.name}>
                  {strategy.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Liquidity
            </label>
            <input
              type="number"
              value={initialLiquidity}
              onChange={(e) => setInitialLiquidity(Number(e.target.value))}
              min={100}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Range (days)
            </label>
            <input
              type="number"
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              min={1}
              max={365}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lower Bin (%)
              </label>
              <input
                type="number"
                value={binRange.lower}
                onChange={(e) => setBinRange({ ...binRange, lower: Number(e.target.value) })}
                max={0}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upper Bin (%)
              </label>
              <input
                type="number"
                value={binRange.upper}
                onChange={(e) => setBinRange({ ...binRange, upper: Number(e.target.value) })}
                min={0}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-8">
          <button
            onClick={handleRunBacktest}
            disabled={!selectedStrategy || loading}
            className="button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Running...' : 'Run Backtest'}
          </button>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-500">Total Return</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {formatPercentage(result.returns)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-500">APR</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {formatPercentage(result.apr)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-500">Fees Earned</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {formatCurrency(result.feesEarned)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-500">Sharpe Ratio</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {result.sharpeRatio.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-500">Total Trades</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {result.totalTrades}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-500">Success Rate</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {formatPercentage(result.successfulTrades / result.totalTrades * 100)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-500">Max Drawdown</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {formatPercentage(result.maxDrawdown)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-500">Volatility</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {formatPercentage(result.volatility)}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Chart</h3>
              <div className="h-80">
                <PerformanceChart
                  data={result.metrics}
                  title="Strategy Performance"
                  yAxisFormat={formatCurrency}
                />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
