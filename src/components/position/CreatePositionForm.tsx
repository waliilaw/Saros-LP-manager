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
  const { dlmmService } : any  = usePositions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pools, setPools] = useState<string[]>([]);
  const [loadingPools, setLoadingPools] = useState(false);
  const [selectedPool, setSelectedPool] = useState('');
  const [quote, setQuote] = useState<null | { amountIn: string; amountOut: string; priceImpact: number }>(null);
  const [quoting, setQuoting] = useState(false);

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

  const handleLoadPools = async () => {
    try {
      setLoadingPools(true);
      setError(null);
      const list = await (dlmmService as any).fetchPoolAddresses();
      setPools(list || []);
    } catch (err) {
      console.error('Failed to fetch pools', err);
      setError('Failed to fetch pools');
    } finally {
      setLoadingPools(false);
    }
  };

  const handleSelectPool = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pool = e.target.value;
    setSelectedPool(pool);
    if (!pool) return;
    try {
      setError(null);
      const meta = await (dlmmService as any).getPoolMetadata(pool);
      if (meta?.baseMint && meta?.quoteMint) {
        setFormData(prev => ({
          ...prev,
          tokenA: meta.baseMint,
          tokenB: meta.quoteMint,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch pool metadata', err);
      setError('Failed to fetch selected pool info');
    }
  };

  const handlePreviewQuote = async () => {
    setQuote(null);
    if (!selectedPool) {
      setError('Select a pool first');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Enter a valid amount to quote');
      return;
    }
    try {
      setQuoting(true);
      setError(null);
      const meta = await (dlmmService as any).getPoolMetadata(selectedPool);
      if (!meta?.baseMint || !meta?.quoteMint || !meta?.extra) {
        throw new Error('Pool metadata incomplete');
      }
      const tokenBase = formData.isTokenA ? meta.baseMint : meta.quoteMint;
      const tokenQuote = formData.isTokenA ? meta.quoteMint : meta.baseMint;
      const tokenBaseDecimal = meta.extra.tokenBaseDecimal ?? 6;
      const tokenQuoteDecimal = meta.extra.tokenQuoteDecimal ?? 6;
      const uiAmount = Number(formData.amount);
      const amount = BigInt(Math.floor(uiAmount * Math.pow(10, tokenBaseDecimal)));
      const res = await (dlmmService as any).getQuote({
        pair: selectedPool,
        tokenBase,
        tokenQuote,
        amount,
        swapForY: !formData.isTokenA, // if input is base, swap for quote
        isExactInput: true,
        tokenBaseDecimal,
        tokenQuoteDecimal,
        slippage: 0.005,
      });
      setQuote({
        amountIn: uiAmount.toString(),
        amountOut: (Number(res.amountOut) / Math.pow(10, tokenQuoteDecimal)).toString(),
        priceImpact: res.priceImpact,
      });
    } catch (err) {
      console.error('Quote failed', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch quote');
    } finally {
      setQuoting(false);
    }
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
      // Temporarily disable on-chain creation until SDK flow is wired
      throw new Error('On-chain position creation coming soon. Use Preview Quote meanwhile.');
    } catch (err) {
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
        <div className="grid grid-cols-3 gap-3 items-end">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Pool (optional)</label>
            <select
              value={selectedPool}
              onChange={handleSelectPool}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">-- Choose a pool --</option>
              {pools.slice(0, 100).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleLoadPools}
            disabled={loadingPools}
            className={`button-secondary ${loadingPools ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loadingPools ? 'Loading...' : 'Load Pools'}
          </button>
        </div>

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

        <div className="pt-2">
          <button
            type="button"
            onClick={handlePreviewQuote}
            disabled={quoting || !selectedPool}
            className={`w-full button-secondary ${quoting || !selectedPool ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {quoting ? 'Quoting...' : 'Preview Quote'}
          </button>
          {quote && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-800">
              <div><span className="font-medium">Amount In:</span> {quote.amountIn}</div>
              <div><span className="font-medium">Estimated Out:</span> {quote.amountOut}</div>
              <div><span className="font-medium">Price Impact:</span> {(quote.priceImpact * 100).toFixed(2)}%</div>
            </div>
          )}
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
