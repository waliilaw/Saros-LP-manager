'use client';

import { motion } from 'framer-motion';
import { usePositions } from '@/context/PositionContext';
import { PerformanceChart } from '../charts/PerformanceChart';
import { formatCurrency, formatPercentage } from '@/lib/utils';

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

export const AnalyticsDashboard = () => {
  const { metrics, generateReport } = usePositions();

  const MetricCard = ({ title, value, subvalue }: { title: string; value: string; subvalue: string }) => (
    <motion.div className="metric-card" {...fadeInUp}>
      <h3 className="metric-title">{title}</h3>
      <div className="metric-value">{value}</div>
      <div className="metric-subvalue">{subvalue}</div>
    </motion.div>
    );

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
            <PerformanceChart data={metrics.tvlHistory} />
          </div>
          <div className="chart-container">
            <h3 className="chart-title">Average APR</h3>
            <PerformanceChart data={metrics.aprHistory} />
          </div>
          <div className="chart-container">
            <h3 className="chart-title">Cumulative Fees</h3>
            <PerformanceChart data={metrics.feesHistory} />
          </div>
          <div className="chart-container">
            <h3 className="chart-title">Trading Volume</h3>
            <PerformanceChart data={metrics.volumeHistory} />
            </div>
        </motion.div>

        <motion.div
          className="mt-8 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <button
            onClick={generateReport}
            className="button-primary"
          >
            Generate Report
          </button>
        </motion.div>
            </div>
        </div>
    );
};