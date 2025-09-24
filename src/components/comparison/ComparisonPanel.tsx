'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { usePositions } from '@/context/PositionContext';
import { ComparisonEngine, ComparisonMetrics } from '@/lib/saros/comparison/engine';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { IDLMMPosition } from '@/lib/saros/interfaces';

const comparisonEngine = new ComparisonEngine();

export const ComparisonPanel: React.FC = () => {
  const { positions, positionMetrics } = usePositions();
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);

  const comparisonResults = useMemo(() => {
    if (selectedPositions.length === 0) return [];
    
    const positionsToCompare = positions.filter(
      pos => selectedPositions.includes(pos.address.toString())
    );
    
    return comparisonEngine.comparePositions(positionsToCompare, positionMetrics);
  }, [positions, positionMetrics, selectedPositions]);

  const handlePositionToggle = (positionId: string) => {
    setSelectedPositions(prev =>
      prev.includes(positionId)
        ? prev.filter(id => id !== positionId)
        : [...prev, positionId]
    );
  };

  const ScoreBar: React.FC<{ score: number; label: string }> = ({ score, label }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{score.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  const PositionCard: React.FC<{ metrics: ComparisonMetrics }> = ({ metrics }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Position {metrics.position.address.toString().slice(0, 8)}...
          </h3>
          <p className="text-sm text-gray-500">
            Liquidity: {formatCurrency(metrics.position.liquidity)}
          </p>
        </div>

        <div className="space-y-3">
          <ScoreBar score={metrics.analysis.overallScore} label="Overall Score" />
          <ScoreBar score={metrics.analysis.riskScore} label="Risk Score" />
          <ScoreBar score={metrics.analysis.efficiencyScore} label="Efficiency Score" />
          <ScoreBar score={metrics.analysis.healthScore} label="Health Score" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">APR Percentile:</span>
            <div className="font-medium">
              {formatPercentage(metrics.relativePerfomance.aprPercentile)}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Volume Percentile:</span>
            <div className="font-medium">
              {formatPercentage(metrics.relativePerfomance.volumePercentile)}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Fees Percentile:</span>
            <div className="font-medium">
              {formatPercentage(metrics.relativePerfomance.feesPercentile)}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Health Percentile:</span>
            <div className="font-medium">
              {formatPercentage(metrics.relativePerfomance.healthPercentile)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-medium text-green-600">Strengths</h4>
            <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
              {metrics.analysis.strengths.map((strength, i) => (
                <li key={i}>{strength}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-red-600">Weaknesses</h4>
            <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
              {metrics.analysis.weaknesses.map((weakness, i) => (
                <li key={i}>{weakness}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-600">Recommendations</h4>
            <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
              {metrics.analysis.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">
            Position Comparison
          </h2>
          <p className="text-gray-600">
            Select positions to compare their performance and characteristics.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Select Positions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {positions.map((position) => (
              <label
                key={position.address.toString()}
                className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedPositions.includes(position.address.toString())}
                  onChange={() => handlePositionToggle(position.address.toString())}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">
                  Position {position.address.toString().slice(0, 8)}...
                </span>
              </label>
            ))}
          </div>
        </div>

        {comparisonResults.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {comparisonResults.map((result) => (
              <PositionCard
                key={result.position.address.toString()}
                metrics={result}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
