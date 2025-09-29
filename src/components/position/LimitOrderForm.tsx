'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { LimitOrderService, LimitOrder } from '@/lib/saros/limit-orders/service';
import { motion } from 'framer-motion';

interface LimitOrderFormProps {
  poolAddress: string;
  tokenA: string;
  tokenB: string;
  currentPrice: number;
  onSuccess?: (order: LimitOrder) => void;
  onError?: (error: Error) => void;
}

export function LimitOrderForm({
  poolAddress,
  tokenA,
  tokenB,
  currentPrice,
  onSuccess,
  onError,
}: LimitOrderFormProps) {
  const { publicKey, signAndSendTransaction } = useWallet();
  const [amount, setAmount] = useState('');
  const [targetPrice, setTargetPrice] = useState(currentPrice.toString());
  const [isTokenA, setIsTokenA] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const limitOrderService = new LimitOrderService();
      const order = await limitOrderService.createLimitOrder({
        poolAddress,
        tokenA,
        tokenB,
        amount: parseFloat(amount),
        targetPrice: parseFloat(targetPrice),
        isTokenA,
        isBuy: parseFloat(targetPrice) > currentPrice,
        payer: publicKey.toString(),
        signAndSendTransaction,
      });

      onSuccess?.(order);
      setAmount('');
      setTargetPrice(currentPrice.toString());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create limit order');
      setError(error.message);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [amount, targetPrice, isTokenA, publicKey, poolAddress, tokenA, tokenB, currentPrice, signAndSendTransaction, onSuccess, onError]);

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-lg rounded-lg p-6 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-bold mb-4">Create Limit Order</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-lg ${
                isTokenA
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setIsTokenA(true)}
            >
              {tokenA}
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-lg ${
                !isTokenA
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setIsTokenA(false)}
            >
              {tokenB}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            min="0"
            step="any"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Price
          </label>
          <div className="relative">
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Enter target price"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="0"
              step="any"
            />
            <div className="absolute right-3 top-2 text-sm text-gray-500">
              Current: {currentPrice.toFixed(6)}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !publicKey}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
            loading || !publicKey
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Creating Order...' : 'Create Limit Order'}
        </button>
      </form>
    </motion.div>
  );
}
