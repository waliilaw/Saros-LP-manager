'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { usePositions } from '@/context/PositionContext';
import { PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount } from '@/lib/saros/token/utils';

interface CreatePositionFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const CreatePositionForm: React.FC<CreatePositionFormProps> = ({
  onSuccess,
  onError,
}) => {
  const { connection, publicKey, connected } = useWallet();
  const { dlmmService } = usePositions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tokenA: '',
    tokenB: '',
    amount: '',
    isTokenA: true,
    lowerBinId: '',
    upperBinId: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.tokenA || !formData.tokenB) {
      setError('Please enter both token addresses');
      return false;
    }

    try {
      new PublicKey(formData.tokenA);
      new PublicKey(formData.tokenB);
    } catch {
      setError('Invalid token address format');
      return false;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (!formData.lowerBinId || !formData.upperBinId) {
      setError('Please enter both bin IDs');
      return false;
    }

    const lowerBin = Number(formData.lowerBinId);
    const upperBin = Number(formData.upperBinId);

    if (lowerBin >= upperBin) {
      setError('Lower bin ID must be less than upper bin ID');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Get or create token accounts
      const tokenAAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey,
        new PublicKey(formData.tokenA)
      );

      const tokenBAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey,
        new PublicKey(formData.tokenB)
      );

      // Create position
      const position = await dlmmService.createPosition({
        tokenA: formData.tokenA,
        tokenB: formData.tokenB,
        amount: Number(formData.amount),
        isTokenA: formData.isTokenA,
        lowerBinId: Number(formData.lowerBinId),
        upperBinId: Number(formData.upperBinId),
      });

      onSuccess?.();
      
      // Reset form
      setFormData({
        tokenA: '',
        tokenB: '',
        amount: '',
        isTokenA: true,
        lowerBinId: '',
        upperBinId: '',
      });

    } catch (err) {
      console.error('Failed to create position:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create position';
      setError(errorMessage);
      onError?.(err as Error);
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
        Create New Position
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token A Address
          </label>
          <input
            type="text"
            name="tokenA"
            value={formData.tokenA}
            onChange={handleInputChange}
            placeholder="Enter Token A address"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token B Address
          </label>
          <input
            type="text"
            name="tokenB"
            value={formData.tokenB}
            onChange={handleInputChange}
            placeholder="Enter Token B address"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Enter amount"
              min="0"
              step="0.000001"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token
            </label>
            <select
              name="isTokenA"
              value={formData.isTokenA.toString()}
              onChange={handleInputChange}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="true">Token A</option>
              <option value="false">Token B</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lower Bin ID
            </label>
            <input
              type="number"
              name="lowerBinId"
              value={formData.lowerBinId}
              onChange={handleInputChange}
              placeholder="Enter lower bin ID"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upper Bin ID
            </label>
            <input
              type="number"
              name="upperBinId"
              value={formData.upperBinId}
              onChange={handleInputChange}
              placeholder="Enter upper bin ID"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={!connected || loading}
            className={`w-full button-primary ${
              !connected || loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Creating Position...' : 'Create Position'}
          </button>
        </div>

        {!connected && (
          <p className="mt-2 text-sm text-gray-500 text-center">
            Connect your wallet to create a position
          </p>
        )}
      </form>
    </motion.div>
  );
};
