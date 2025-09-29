'use client';

import { motion } from 'framer-motion';
import { SOLANA_NETWORK } from '@/lib/saros/config';
import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';

export const NetworkStatus = () => {
  const [isClient, setIsClient] = useState(false);
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [latency, setLatency] = useState<number>(0);
  const { connection } = useWallet();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let mounted = true;

    const checkConnection = async () => {
      if (!connection) {
        if (mounted) {
          setStatus('error');
        }
        return;
      }
      
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
  }, [connection, isClient]);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return latency > 1000 
          ? 'text-gray-800 bg-gray-100 border-gray-300' 
          : 'text-gray-800 bg-gray-100 border-gray-300';
      case 'error':
        return 'text-gray-800 bg-gray-100 border-gray-300';
      default:
        return 'text-gray-800 bg-gray-100 border-gray-300';
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

  if (!isClient) {
    return (
      <div className="px-3 py-1 rounded-full text-xs font-medium text-gray-800 bg-gray-100 border border-gray-300 backdrop-blur-sm">
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
      className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm hover:bg-gray-200 transition-colors ${getStatusColor()}`}
    >
      <div className="flex items-center space-x-2">
        <span className={`w-2 h-2 rounded-full ${
          status === 'connected' ? (latency > 1000 ? 'bg-gray-600' : 'bg-gray-800') :
          status === 'error' ? 'bg-gray-600' : 'bg-gray-400'
        }`} />
        <span>{getStatusText()}</span>
      </div>
    </motion.div>
  );
};