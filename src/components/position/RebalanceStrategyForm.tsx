'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { RebalancingService, RebalanceStrategy, RebalanceResult } from '@/lib/saros/rebalancing/service';
import { motion } from 'framer-motion';

interface RebalanceStrategyFormProps {
  poolAddress: string;
  positionId: string;
  onSuccess?: (result: RebalanceResult) => void;
  onError?: (error: Error) => void;
}

const strategyTypes = [
  {
    id: 'symmetric',
    name: 'Symmetric',
    description: 'Equal distribution around active bin',
  },
  {
    id: 'dynamic',
    name: 'Dynamic',
    description: 'Adjusts based on market volatility',
  },
  {
    id: 'concentrated',
    name: 'Concentrated',
    description: 'Focuses liquidity near active bin',
  },
] as const;

export function RebalanceStrategyForm({
  poolAddress,
  positionId,
  onSuccess,
  onError,
}: RebalanceStrategyFormProps) {
  const { publicKey, signAndSendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<RebalanceStrategy>({
    type: 'symmetric',
    targetUtilization: 80,
    rebalanceThreshold: 3,
    minBinSpread: 5,
    maxBinSpread: 20,
    concentrationFactor: 2,
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const rebalancingService = new RebalancingService();
      const result = await rebalancingService.rebalancePosition({
        poolAddress,
        positionId,
        strategy,
        payer: publicKey.toString(),
        signAndSendTransaction,
      });

      if (result.success) {
        onSuccess?.(result);
      } else {
        throw new Error(result.error || 'Failed to rebalance position');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to rebalance position');
      setError(error.message);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [publicKey, poolAddress, positionId, strategy, signAndSendTransaction, onSuccess, onError]);

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-lg rounded-lg p-6 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-bold mb-4">Rebalancing Strategy</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Strategy Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {strategyTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setStrategy({ ...strategy, type: type.id })}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  strategy.type === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <div className="font-medium">{type.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {type.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Utilization (%)
            </label>
            <input
              type="number"
              value={strategy.targetUtilization}
              onChange={(e) => setStrategy({
                ...strategy,
                targetUtilization: Math.min(100, Math.max(0, parseInt(e.target.value))),
              })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="0"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rebalance Threshold (bins)
            </label>
            <input
              type="number"
              value={strategy.rebalanceThreshold}
              onChange={(e) => setStrategy({
                ...strategy,
                rebalanceThreshold: Math.max(1, parseInt(e.target.value)),
              })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Bin Spread
            </label>
            <input
              type="number"
              value={strategy.minBinSpread}
              onChange={(e) => setStrategy({
                ...strategy,
                minBinSpread: Math.max(1, parseInt(e.target.value)),
              })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Bin Spread
            </label>
            <input
              type="number"
              value={strategy.maxBinSpread}
              onChange={(e) => setStrategy({
                ...strategy,
                maxBinSpread: Math.max(strategy.minBinSpread, parseInt(e.target.value)),
              })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min={strategy.minBinSpread}
            />
          </div>

          {strategy.type === 'concentrated' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Concentration Factor
              </label>
              <input
                type="number"
                value={strategy.concentrationFactor}
                onChange={(e) => setStrategy({
                  ...strategy,
                  concentrationFactor: Math.max(1, parseFloat(e.target.value)),
                })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="1"
                step="0.1"
              />
              <p className="mt-1 text-sm text-gray-500">
                Higher values concentrate liquidity closer to the active bin
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !publicKey}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
            loading || !publicKey
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Rebalancing...' : 'Apply Strategy'}
        </button>
      </form>
    </motion.div>
  );
}
