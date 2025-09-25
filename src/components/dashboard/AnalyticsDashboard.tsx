'use client';

import { motion } from 'framer-motion';
import { usePositions } from '@/context/PositionContext';
import { useWallet } from '@/context/WalletContext';
import { PerformanceChart } from '../charts/PerformanceChart';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { useMemo } from 'react';
import { TimeSeriesData } from '@/lib/saros/interfaces';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface DashboardMetrics {
  totalValueLocked: number;
  totalFeesEarned: number;
  volume24h: number;
  averageApr: number;
  impermanentLoss: number;
  healthyPositions: number;
  totalPositions: number;
  tvlHistory: TimeSeriesData[];
  aprHistory: TimeSeriesData[];
  feesHistory: TimeSeriesData[];
  volumeHistory: TimeSeriesData[];
}

export const AnalyticsDashboard = () => {
  const { positions, positionMetrics, loading, error } = usePositions();
  
  console.log('=== AnalyticsDashboard ===');
  console.log('Positions:', positions);
  console.log('Positions length:', positions.length);
  console.log('Loading:', loading);
  console.log('Error:', error);
  const { connected, publicKey, connect, connecting } = useWallet();

  const metrics = useMemo<DashboardMetrics>(() => {
    const totalValueLocked = positions.reduce((sum, pos) => sum + (pos.liquidity || 0), 0);
    const totalFeesEarned = Array.from(positionMetrics.values()).reduce((sum, metrics) => sum + (metrics.feesEarned || 0), 0);
    const volume24h = Array.from(positionMetrics.values()).reduce((sum, metrics) => sum + (metrics.volume24h || 0), 0);
    const averageApr = positions.length > 0 
      ? Array.from(positionMetrics.values()).reduce((sum, metrics) => sum + (metrics.apr || 0), 0) / positions.length 
      : 0;
    const impermanentLoss = Array.from(positionMetrics.values()).reduce((sum, metrics) => sum + (metrics.impermanentLoss || 0), 0);
    const healthyPositions = positions.filter(pos => pos.healthFactor >= 1).length;

    const now = Date.now();
    const dayAgo = now - 86400000;

    return {
      totalValueLocked,
      totalFeesEarned,
      volume24h,
      averageApr,
      impermanentLoss,
      healthyPositions,
      totalPositions: positions.length,
      tvlHistory: [
        { timestamp: dayAgo, value: totalValueLocked * 0.9 },
        { timestamp: now, value: totalValueLocked }
      ],
      aprHistory: [
        { timestamp: dayAgo, value: averageApr * 1.1 },
        { timestamp: now, value: averageApr }
      ],
      feesHistory: [
        { timestamp: dayAgo, value: totalFeesEarned * 0.8 },
        { timestamp: now, value: totalFeesEarned }
      ],
      volumeHistory: [
        { timestamp: dayAgo, value: volume24h * 1.2 },
        { timestamp: now, value: volume24h }
      ],
    };
  }, [positions, positionMetrics]);

  const MetricCard = ({ title, value, subvalue }: { title: string; value: string; subvalue: string }) => (
    <motion.div className="metric-card" {...fadeInUp}>
      <h3 className="metric-title">{title}</h3>
      <div className="metric-value">{value}</div>
      <div className="metric-subvalue">{subvalue}</div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  // Show wallet connection prompt if not connected
  if (!connected || !publicKey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-lg text-gray-600">Connect your wallet to view your positions</div>
          <button
            onClick={connect}
            disabled={connecting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  // Show empty state when wallet is connected but no positions
  if (!loading && positions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-lg text-gray-600">No positions found</div>
          <div className="text-sm text-gray-500">Create your first liquidity position to get started</div>
          <a
            href="/setup"
            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create Position
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="dashboard-title">Portfolio Analytics</h1>
        <p className="dashboard-subtitle">
          Real-time insights into your liquidity positions
        </p>
      </motion.div>

      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="stats-grid"
      >
        <MetricCard
          title="TOTAL VALUE LOCKED"
          value={formatCurrency(metrics.totalValueLocked)}
          subvalue="Total liquidity"
        />
        <MetricCard
          title="TOTAL FEES EARNED"
          value={formatCurrency(metrics.totalFeesEarned)}
          subvalue="Cumulative earnings"
        />
        <MetricCard
          title="24H VOLUME"
          value={formatCurrency(metrics.volume24h)}
          subvalue="Trading activity"
        />
        <MetricCard
          title="AVERAGE APR"
          value={formatPercentage(metrics.averageApr)}
          subvalue="Annual yield"
        />
        <MetricCard
          title="TOTAL IMPERMANENT LOSS"
          value={formatCurrency(metrics.impermanentLoss)}
          subvalue="Price impact"
        />
        <MetricCard
          title="POSITION HEALTH"
          value={`${metrics.healthyPositions}`}
          subvalue={`of ${metrics.totalPositions} positions healthy`}
        />
      </motion.div>

      <div className="performance-section">
        <motion.h2
          className="performance-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Performance History
        </motion.h2>

        <motion.div
          className="charts-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="chart-container">
            <h3 className="chart-title">Total Value Locked</h3>
            <PerformanceChart 
              data={metrics.tvlHistory}
              title="TVL"
              yAxisFormat={formatCurrency}
            />
          </div>
          <div className="chart-container">
            <h3 className="chart-title">Average APR</h3>
            <PerformanceChart 
              data={metrics.aprHistory}
              title="APR"
              yAxisFormat={formatPercentage}
            />
          </div>
          <div className="chart-container">
            <h3 className="chart-title">Cumulative Fees</h3>
            <PerformanceChart 
              data={metrics.feesHistory}
              title="Fees"
              yAxisFormat={formatCurrency}
            />
          </div>
          <div className="chart-container">
            <h3 className="chart-title">Trading Volume</h3>
            <PerformanceChart 
              data={metrics.volumeHistory}
              title="Volume"
              yAxisFormat={formatCurrency}
            />
          </div>
        </motion.div>

        <motion.div
          className="mt-8 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <button
            onClick={() => {}}
            className="button-primary"
          >
            Generate Report
          </button>
        </motion.div>
      </div>
    </div>
  );
};