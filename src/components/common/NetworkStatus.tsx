'use client';

import { motion } from 'framer-motion';
import { useWallet } from '@/context/WalletContext';
import { SOLANA_NETWORK } from '@/lib/saros/config';
import { useState, useEffect } from 'react';

export const NetworkStatus = () => {
  const { connection } = useWallet();
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [latency, setLatency] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkConnection = async () => {
      try {
        const start = performance.now();
        const slot = await connection.getSlot();
        const end = performance.now();

        if (mounted) {
          setLatency(Math.round(end - start));
          setStatus(slot ? 'connected' : 'error');
        }
      } catch (error) {
        if (mounted) {
          console.error('Network check failed:', error);
          setStatus('error');
        }
      }
    };

    // Check immediately and then every 10 seconds
    checkConnection();
    const interval = setInterval(checkConnection, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [connection]);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return latency > 1000 ? 'text-yellow-800 bg-yellow-100/80 border-yellow-300/50' : 'text-green-800 bg-green-100/80 border-green-300/50';
      case 'error':
        return 'text-red-800 bg-red-100/80 border-red-300/50';
      default:
        return 'text-gray-800 bg-gray-100/80 border-gray-300/50';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return `${SOLANA_NETWORK} (${latency}ms)`;
      case 'error':
        return 'Network Error';
      default:
        return 'Connecting...';
    }
  };

  if (!mounted) {
    return (
      <div className="px-3 py-1 rounded-full text-xs font-medium text-gray-800 bg-gray-100/80 border border-gray-300/50 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor()}`}
    >
      <div className="flex items-center space-x-2">
        <span className={`w-2 h-2 rounded-full ${
          status === 'connected' ? (latency > 1000 ? 'bg-yellow-600' : 'bg-green-600') :
          status === 'error' ? 'bg-red-600' : 'bg-gray-400'
        }`} />
        <span>{getStatusText()}</span>
      </div>
    </motion.div>
  );
};
