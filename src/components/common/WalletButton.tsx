'use client';

import { motion } from 'framer-motion';
import { useWallet } from '@/context/WalletContext';
import { useState, useEffect } from 'react';

export const WalletButton = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <button
        className="px-4 py-1 rounded-full text-sm font-medium text-gray-800 bg-gray-100 border border-gray-300 backdrop-blur-sm"
      >
        Loading...
      </button>
    );
  }

  const { publicKey, connected, connecting, connect, disconnect } = useWallet();

  const handleClick = () => {
    if (connected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={handleClick}
      disabled={connecting}
      className={`
        px-4 py-1 rounded-full text-sm font-medium backdrop-blur-sm
        ${connecting ? 'cursor-not-allowed opacity-50' : ''}
        ${connected 
          ? 'text-gray-800 bg-gray-100 border border-gray-300 hover:bg-gray-200' 
          : 'text-gray-800 bg-gray-100 border border-gray-300 hover:bg-gray-200'
        }
        transition-colors
      `}
    >
      {connecting ? (
        'Connecting...'
      ) : connected ? (
        <span className="flex items-center space-x-2">
          <span>{publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}</span>
          <span className="w-2 h-2 rounded-full bg-gray-800" />
        </span>
      ) : (
        'Connect Wallet'
      )}
    </motion.button>
  );
};