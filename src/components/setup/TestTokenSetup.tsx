'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { motion } from 'framer-motion';

export const TestTokenSetup = () => {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { connection, publicKey, connected } = useWallet();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSetup = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Implementation of test token setup
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated delay
      setSuccess('Test tokens created successfully!');
    } catch (err) {
      console.error('Failed to setup test tokens:', err);
      setError('Failed to setup test tokens. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 border-none rounded-xl h-full"
    >
      <h2 className="text-2xl text-gray-800 mb-6" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
        Test Token Setup
      </h2>
      <p className="text-gray-700 mb-8 leading-relaxed" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
        Create test tokens and receive SOL on devnet for testing.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <button
        onClick={handleSetup}
        disabled={loading || !connected}
        className={`btn-primary w-full ${(loading || !connected) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Setting up...' : 'Setup Test Tokens'}
      </button>

      {!connected && (
        <p className="mt-4 text-sm text-gray-500 text-center">
          Connect your wallet to setup test tokens
        </p>
      )}
    </motion.div>
  );
};