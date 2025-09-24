'use client';

import { useEffect, useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { motion } from 'framer-motion';
import { usePriceFeed } from '@/hooks/usePriceFeed';
import { formatCurrency } from '@/lib/utils';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceChartProps {
  token: string;
  timeframe?: '1h' | '4h' | '1d' | '1w' | '1m';
  height?: number;
  showVolume?: boolean;
  showControls?: boolean;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  token,
  timeframe = '1d',
  height = 400,
  showVolume = true,
  showControls = true,
}) => {
  const { prices, getHistoricalPrices } = usePriceFeed([token]);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [historicalData, setHistoricalData] = useState<{ timestamp: number; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const priceData = prices.get(token);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setLoading(true);
      try {
        const endTime = Date.now();
        let startTime: number;
        let interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

        switch (selectedTimeframe) {
          case '1h':
            startTime = endTime - 3600000;
            interval = '1m';
            break;
          case '4h':
            startTime = endTime - 14400000;
            interval = '5m';
            break;
          case '1d':
            startTime = endTime - 86400000;
            interval = '15m';
            break;
          case '1w':
            startTime = endTime - 604800000;
            interval = '1h';
            break;
          case '1m':
            startTime = endTime - 2592000000;
            interval = '4h';
            break;
          default:
            startTime = endTime - 86400000;
            interval = '15m';
        }

        const data = await getHistoricalPrices(token, startTime, endTime, interval);
        setHistoricalData(data);
      } catch (error) {
        console.error('Failed to fetch historical data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [token, selectedTimeframe, getHistoricalPrices]);

  const chartData = useMemo(() => {
    if (!historicalData.length) return null;

    return {
      labels: historicalData.map(d => 
        new Date(d.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      ),
      datasets: [
        {
          label: 'Price',
          data: historicalData.map(d => d.value),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHitRadius: 10,
          borderWidth: 2,
        },
      ],
    };
  }, [historicalData]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `Price: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
      y: {
        position: 'right' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value: number) => formatCurrency(value),
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  }), []);

  const timeframeOptions = [
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '1d', label: '1D' },
    { value: '1w', label: '1W' },
    { value: '1m', label: '1M' },
  ];

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <div className="text-gray-500">Loading price data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Price */}
      {priceData && (
        <div className="flex items-baseline space-x-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold"
          >
            {formatCurrency(priceData.price)}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-sm ${
              priceData.data?.change24h >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {priceData.data?.change24h >= 0 ? '+' : ''}
            {(priceData.data?.change24h * 100).toFixed(2)}%
          </motion.div>
        </div>
      )}

      {/* Timeframe Controls */}
      {showControls && (
        <div className="flex space-x-2">
          {timeframeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedTimeframe(option.value as any)}
              className={`px-3 py-1 text-sm rounded-full ${
                selectedTimeframe === option.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <div style={{ height }}>
        {chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <div className="text-gray-500">No price data available</div>
          </div>
        )}
      </div>

      {/* Volume */}
      {showVolume && priceData?.data?.volume24h && (
        <div className="text-sm text-gray-600">
          24h Volume: {formatCurrency(priceData.data.volume24h)}
        </div>
      )}
    </div>
  );
};
