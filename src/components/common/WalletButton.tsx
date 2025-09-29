'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Use dynamic import to avoid SSR issues
const useWalletHook = () => {
  const [wallet, setWallet] = useState<any>(null);
  
  useEffect(() => {
    // Only load wallet on client side
    if (typeof window !== 'undefined') {
      import('@/context/WalletContext').then(({ useWallet }) => {
        try {
          const walletContext = useWallet();
          setWallet(walletContext);
        } catch {
          // Context not available, use fallback
          setWallet({
            publicKey: null,
            connected: false,
            connecting: false,
            connect: async () => {},
            disconnect: async () => {}
          });
        }
      });
    }
  }, []);
  
  return wallet || {
    publicKey: null,
    connected: false,
    connecting: false,
    connect: async () => {},
    disconnect: async () => {}
  };
};

export const WalletButton = () => {
  const { publicKey, connected, connecting, connect, disconnect } = useWalletHook();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="px-4 py-2 rounded-lg font-medium shadow-sm bg-gray-100 text-gray-400">
        Loading...
      </button>
    );
  }

  const handleClick = async () => {
    try {
      if (connected) {
        await disconnect();
      } else {
        await connect();
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm border transition-all duration-200 backdrop-blur-sm ${
        connected
          ? 'bg-green-100/80 text-green-800 border-green-300/50 hover:bg-green-200/80'
          : 'bg-blue-100/80 text-blue-800 border-blue-300/50 hover:bg-blue-200/80'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={connecting}
    >
      {connecting ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Connecting...
        </span>
      ) : connected ? (
        <span className="flex items-center space-x-2">
          <span>Connected: {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}</span>
          <span className="text-xs">(Click to disconnect)</span>
        </span>
      ) : (
        'Connect Wallet'
      )}
    </motion.button>
  );
};
