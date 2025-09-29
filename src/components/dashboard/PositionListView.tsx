'use client';

import { motion } from 'framer-motion';
import { usePositions } from '@/context/PositionContext';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { useState } from 'react';

export const PositionListView = () => {
  const { positions, positionMetrics, loading } = usePositions();
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);


  const getHealthLabel = (healthScore: number) => {
    if (healthScore >= 80) return 'Healthy';
    if (healthScore >= 50) return 'Moderate';
    return 'At Risk';
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-600">
        Loading positions...
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-gray-600 mb-4">No active positions</div>
        <p className="text-gray-500 mb-6">Create your first liquidity position to get started</p>
        <a
          href="/setup"
          className="btn-primary inline-block"
        >
          Create Position
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {positions.map((position, index) => {
        const metrics = positionMetrics.get(position.address.toString());
        const positionAddress = position.address.toString();
        
        return (
          <motion.div
            key={positionAddress}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-container overflow-hidden rounded-2xl border border-gray-200"
          >
            <div className="glass-container__background"></div>
            <div className="relative z-10 p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200">
                <div>
                  <h3 className="text-2xl text-gray-800 mb-3" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                    {position.tokenA || 'Token A'} / {position.tokenB || 'Token B'}
                  </h3>
                  <div className="flex flex-col gap-2">
                    <a
                      href={`https://explorer.solana.com/address/${positionAddress}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline font-mono"
                    >
                      {positionAddress}
                    </a>
                    <div className="text-sm text-gray-600">
                      Bin Range: {position.lowerBinId} → {position.upperBinId}
                      {metrics && metrics.priceRange && (
                        <span className="ml-2 font-mono">
                          (${metrics.priceRange.lower.toFixed(4)} - ${metrics.priceRange.upper.toFixed(4)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {metrics && (
                  <div className="bg-white/50 px-4 py-2 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Health Score</div>
                    <div className="text-lg text-gray-800 font-bold" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                      {metrics.healthScore}/100
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{getHealthLabel(metrics.healthScore)}</div>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/50 p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Liquidity</div>
                  <div className="text-xl text-gray-800" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                    {formatCurrency(position.liquidity || 0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Total Value</div>
                </div>

                <div className="bg-white/50 p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide">APR</div>
                  <div className="text-xl text-gray-800" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                    {metrics ? formatPercentage(metrics.apr) : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Annual Yield</div>
                </div>

                <div className="bg-white/50 p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Fees Earned</div>
                  <div className="text-xl text-gray-800" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                    {metrics ? formatCurrency(metrics.feesEarned) : '$0.00'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Total Earnings</div>
                </div>

                <div className="bg-white/50 p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Utilization</div>
                  <div className="text-xl text-gray-800" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
                    {metrics ? `${(metrics.utilization * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Active Usage</div>
                </div>
              </div>

              {/* Additional Metrics */}
              {metrics && (
                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">24h Volume</span>
                    <span className="text-sm text-gray-800 font-semibold" style={{ fontFamily: 'CustomFont', fontWeight: 600 }}>
                      {formatCurrency(metrics.volume24h)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Impermanent Loss</span>
                    <span className="text-sm text-gray-800 font-semibold" style={{ fontFamily: 'CustomFont', fontWeight: 600 }}>
                      {formatCurrency(metrics.impermanentLoss)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedPosition(positionAddress)}
                  className="btn-secondary text-center"
                >
                  Adjust Position
                </button>
                <button
                  className="btn-secondary text-center"
                >
                  Remove Liquidity
                </button>
                <a
                  href={`https://explorer.solana.com/address/${positionAddress}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-center"
                >
                  View on Explorer
                </a>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};