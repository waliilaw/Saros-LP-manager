'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { createTestToken, requestAirdrop } from '@/lib/saros/token/utils';
import { TransactionHelper } from '@/lib/saros/transaction/helper';

export const TestTokenSetup = () => {
  const { connection, publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSetup = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Request SOL airdrop first
      await requestAirdrop(connection, publicKey);
      setSuccess('Received SOL airdrop');

      // Create test tokens
      const tokenA = await createTestToken(connection, publicKey);
      const tokenB = await createTestToken(connection, publicKey);

      setSuccess(
        `Setup complete!\n` +
        `Token A: ${tokenA.mint.toString()}\n` +
        `Token B: ${tokenB.mint.toString()}`
      );
    } catch (err) {
      console.error('Setup failed:', err);
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <h2 className="text-xl font-medium text-gray-900 mb-4">
        Test Token Setup
      </h2>

      <p className="text-gray-600 mb-6">
        Create test tokens and receive SOL on devnet for testing.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg whitespace-pre-wrap font-mono text-sm">
          {success}
        </div>
      )}

      <button
        onClick={handleSetup}
        disabled={!connected || loading}
        className={`w-full button-primary ${
          !connected
            ? 'opacity-50 cursor-not-allowed'
            : loading
            ? 'animate-pulse'
            : ''
        }`}
      >
        {loading ? 'Setting up...' : 'Setup Test Tokens'}
      </button>

      {!connected && (
        <p className="mt-2 text-sm text-gray-500 text-center">
          Connect your wallet to continue
        </p>
      )}
    </motion.div>
  );
};
