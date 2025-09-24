'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { usePositions } from '@/context/PositionContext';
import { IDLMMPosition } from '@/lib/saros/interfaces';
import { RebalanceParams } from '@/lib/saros/automation/strategy';

interface StrategyManagerProps {
  position: IDLMMPosition;
}

export const StrategyManager: React.FC<StrategyManagerProps> = ({ position }) => {
  const { automationManager } = usePositions();
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [rebalanceThreshold, setRebalanceThreshold] = useState(5); // 5%
  const [minLiquidity, setMinLiquidity] = useState(100); // 100 tokens

  const handleActivateStrategy = async () => {
    if (!selectedStrategy) return;

    const params: RebalanceParams = {
      position,
      currentPrice: 0, // TODO: Get current price from price feed
      targetPriceRange: {
        lower: position.lowerBinId,
        upper: position.upperBinId,
      },
      rebalanceThreshold: rebalanceThreshold / 100,
      minLiquidity,
    };

    try {
      const success = await automationManager.activateStrategy(
        position.address.toString(),
        selectedStrategy,
        params
      );

      if (success) {
        // TODO: Show success notification
      }
    } catch (error) {
      console.error('Failed to activate strategy:', error);
      // TODO: Show error notification
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">
        Automation Strategy
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Strategy
          </label>
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Choose a strategy...</option>
            {automationManager.strategies.map((strategy) => (
              <option key={strategy.name} value={strategy.name}>
                {strategy.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rebalance Threshold (%)
          </label>
          <input
            type="number"
            value={rebalanceThreshold}
            onChange={(e) => setRebalanceThreshold(Number(e.target.value))}
            min={1}
            max={50}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Liquidity
          </label>
          <input
            type="number"
            value={minLiquidity}
            onChange={(e) => setMinLiquidity(Number(e.target.value))}
            min={0}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="pt-4">
          <button
            onClick={handleActivateStrategy}
            disabled={!selectedStrategy}
            className="w-full button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Activate Strategy
          </button>
        </div>
      </div>
    </motion.div>
  );
};
