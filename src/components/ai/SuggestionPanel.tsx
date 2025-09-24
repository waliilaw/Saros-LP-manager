'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { usePositions } from '@/context/PositionContext';
import { AISuggestionEngine, MarketCondition, PricePrediction, PositionSuggestion } from '@/lib/saros/ai/suggestion-engine';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { IDLMMPosition } from '@/lib/saros/interfaces';

const suggestionEngine = new AISuggestionEngine();

export const SuggestionPanel: React.FC = () => {
  const { positions, positionMetrics, priceFeedService } = usePositions();
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    marketCondition: MarketCondition;
    prediction: PricePrediction;
    suggestion: PositionSuggestion;
  } | null>(null);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const position = selectedPosition
        ? positions.find(p => p.address.toString() === selectedPosition)
        : undefined;
      const metrics = position
        ? positionMetrics.get(position.address.toString())
        : undefined;

      // Get historical price data
      const endTime = Date.now();
      const startTime = endTime - (7 * 24 * 60 * 60 * 1000); // 7 days
      const priceHistory = await priceFeedService.getHistoricalPrices(startTime, endTime);

      const results = await suggestionEngine.generateSuggestions(
        priceHistory,
        position,
        metrics
      );

      setSuggestions(results);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      // TODO: Show error notification
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPosition) {
      generateSuggestions();
    }
  }, [selectedPosition]);

  const MarketConditionCard: React.FC<{ condition: MarketCondition }> = ({ condition }) => (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Market Conditions</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Trend</span>
          <span className={`font-medium ${
            condition.trend === 'bullish' ? 'text-green-600' :
            condition.trend === 'bearish' ? 'text-red-600' :
            'text-blue-600'
          }`}>
            {condition.trend.toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Volatility</span>
          <span className="font-medium">{condition.volatility.toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Volume</span>
          <span className="font-medium">{condition.volume.toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Confidence</span>
          <span className="font-medium">{formatPercentage(condition.confidence * 100)}</span>
        </div>
      </div>
    </div>
  );

  const PricePredictionCard: React.FC<{ prediction: PricePrediction }> = ({ prediction }) => (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Price Prediction (24h)</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Expected Price</span>
          <span className="font-medium">{formatCurrency(prediction.expectedPrice)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Upper Bound</span>
          <span className="font-medium">{formatCurrency(prediction.upperBound)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Lower Bound</span>
          <span className="font-medium">{formatCurrency(prediction.lowerBound)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Confidence</span>
          <span className="font-medium">{formatPercentage(prediction.confidence * 100)}</span>
        </div>
      </div>
    </div>
  );

  const StrategySuggestionCard: React.FC<{ suggestion: PositionSuggestion }> = ({ suggestion }) => (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{suggestion.strategy.name}</h3>
          <p className="text-sm text-gray-600">{suggestion.strategy.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          suggestion.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
          suggestion.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {suggestion.riskLevel.toUpperCase()} RISK
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Strategy Parameters</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Lower Bin</span>
              <div className="font-medium">{suggestion.strategy.params.lowerBinId}</div>
            </div>
            <div>
              <span className="text-gray-600">Upper Bin</span>
              <div className="font-medium">{suggestion.strategy.params.upperBinId}</div>
            </div>
            <div>
              <span className="text-gray-600">Target Liquidity</span>
              <div className="font-medium">{formatCurrency(suggestion.strategy.params.targetLiquidity)}</div>
            </div>
            <div>
              <span className="text-gray-600">Rebalance Threshold</span>
              <div className="font-medium">{formatPercentage(suggestion.strategy.params.rebalanceThreshold * 100)}</div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Expected Return</h4>
          <div className="text-2xl font-bold text-green-600">
            {formatPercentage(suggestion.expectedReturn)}
          </div>
          <div className="text-sm text-gray-600">
            Confidence: {formatPercentage(suggestion.confidence * 100)}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Reasoning</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            {suggestion.reasoning.map((reason, i) => (
              <li key={i} className="flex items-center">
                <span className="mr-2">•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Risk Factors</h4>
          <ul className="space-y-1 text-sm text-red-600">
            {suggestion.risks.map((risk, i) => (
              <li key={i} className="flex items-center">
                <span className="mr-2">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Alternative Strategies</h4>
          {suggestion.alternatives.map((alt, i) => (
            <div key={i} className="mt-3">
              <h5 className="text-sm font-medium text-gray-800">{alt.strategy}</h5>
              <ul className="mt-1 space-y-1 text-sm text-gray-600">
                {alt.tradeoffs.map((tradeoff, j) => (
                  <li key={j} className="flex items-center">
                    <span className="mr-2">•</span>
                    {tradeoff}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
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
            AI Position Suggestions
          </h2>
          <p className="text-gray-600">
            Get intelligent suggestions for new positions or optimizations based on market analysis.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="max-w-xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Position (optional)
            </label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">New Position</option>
              {positions.map((position) => (
                <option key={position.address.toString()} value={position.address.toString()}>
                  Position {position.address.toString().slice(0, 8)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Generating suggestions...</div>
          </div>
        ) : suggestions ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <MarketConditionCard condition={suggestions.marketCondition} />
              <PricePredictionCard prediction={suggestions.prediction} />
            </div>
            <StrategySuggestionCard suggestion={suggestions.suggestion} />
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};
