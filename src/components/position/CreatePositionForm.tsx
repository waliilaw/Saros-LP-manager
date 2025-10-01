'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { usePositions } from '@/context/PositionContext';
import { PublicKey } from '@solana/web3.js';
import { SarosDLMMService } from '@/lib/saros/dlmm-service';

interface PositionCreationResult {
  signature: string;
  positionAddress: string;
  positionMint: string;
}

interface CreatePositionFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const CreatePositionForm: React.FC<CreatePositionFormProps> = ({
  onSuccess,
  onError,
}) => {
  // All hooks must be called before any conditional returns
  const [isClient, setIsClient] = useState(false);
  const [dlmmService, setDlmmService] = useState<SarosDLMMService | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pools, setPools] = useState<string[]>([]);
  const [loadingPools, setLoadingPools] = useState(false);
  const [quote, setQuote] = useState<null | { amountIn: string; amountOut: string; priceImpact: number }>(null);
  const [quoting, setQuoting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tokenA: '',
    tokenB: '',
    amount: '',
    isTokenA: true,
    lowerBinId: '',
    upperBinId: '',
  });

  const { connection, publicKey, connected } = useWallet();
  const { 
    createPosition, 
    selectedPool, 
    setSelectedPool, 
    loading: contextLoading,
    error: contextError 
  }: any = usePositions();

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Initialize dlmm service
  useEffect(() => {
    if (connection && isClient) {
      const service = new SarosDLMMService(connection);
      setDlmmService(service);
    }
  }, [connection, isClient]);

  // Watch for context errors
  useEffect(() => {
    if (contextError && !error) {
      setError(`Context Error: ${contextError}`);
    }
  }, [contextError, error]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleLoadPools = useCallback(async () => {
    if (!dlmmService) return;
    try {
      setLoadingPools(true);
      setError(null);
      const list = await dlmmService.fetchPoolAddresses();
      setPools(list || []);
    } catch (err) {
      console.error('Failed to fetch pools', err);
      setError('Failed to fetch pools');
    } finally {
      setLoadingPools(false);
    }
  }, [dlmmService]);

  const handleSelectPool = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pool = e.target.value;
    console.log('🔍 Selected pool:', pool);
    setSelectedPool(pool); // Use the global setter
    
    if (!pool) {
      console.log('❌ No pool selected');
      return;
    }
    if (!dlmmService) {
      console.log('❌ DLMM service not initialized');
      return;
    }

    try {
      setError(null);
      console.log('📡 Fetching pool metadata for:', pool);
      const meta = await dlmmService.getPoolMetadata(pool);
      console.log('📦 Raw pool metadata:', meta);

      if (!meta) {
        console.error('❌ Pool metadata is null');
        throw new Error('Failed to fetch pool metadata - received null');
      }

      // Log all potential token properties
      console.log('🔑 Available token properties:', {
        tokenX: meta.tokenX,
        tokenY: meta.tokenY,
        tokenMintX: meta.tokenMintX,
        tokenMintY: meta.tokenMintY,
        baseMint: meta.baseMint,
        quoteMint: meta.quoteMint,
        mintX: meta.mintX,
        mintY: meta.mintY,
        // Log raw object keys to see what's actually available
        allKeys: Object.keys(meta)
      });
      
      // Try different property names the SDK might use
      const tokenX = meta?.tokenX || meta?.tokenMintX || meta?.baseMint || meta?.mintX;
      const tokenY = meta?.tokenY || meta?.tokenMintY || meta?.quoteMint || meta?.mintY;
      
      console.log('🎯 Found token addresses:', { tokenX, tokenY });
      
      if (tokenX && tokenY) {
        // Convert to string if they're PublicKey objects
        const tokenAStr = typeof tokenX === 'string' ? tokenX : tokenX.toString();
        const tokenBStr = typeof tokenY === 'string' ? tokenY : tokenY.toString();
        
        console.log('✅ Setting form data with tokens:', { tokenAStr, tokenBStr });
        
        setFormData(prev => ({
          ...prev,
          tokenA: tokenAStr,
          tokenB: tokenBStr,
        }));
        setError(null);
      } else {
        console.warn('⚠️ Token addresses not found in metadata. Available data:', meta);
        // Try to extract from raw data if available
        if (meta.state && typeof meta.state === 'object') {
          console.log('🔍 Checking pool state object:', meta.state);
          const state = meta.state;
          const stateTokenX = state.tokenX || state.token_x || state.base_mint;
          const stateTokenY = state.tokenY || state.token_y || state.quote_mint;
          
          if (stateTokenX && stateTokenY) {
            console.log('✅ Found tokens in state:', { stateTokenX, stateTokenY });
            setFormData(prev => ({
              ...prev,
              tokenA: stateTokenX.toString(),
              tokenB: stateTokenY.toString(),
            }));
            setError(null);
            return;
          }
        }
        
        setError('Could not auto-fill token addresses. Please enter them manually. Check console for details.');
      }
    } catch (err: any) {
      console.error('❌ Failed to fetch pool metadata:', err);
      const errorMsg = err?.message || String(err);
      
      // Check for network/RPC errors
      if (errorMsg.includes('503') || errorMsg.includes('Service unavailable')) {
        console.error('🔴 RPC Endpoint Error (503):', {
          endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'default endpoint',
          error: errorMsg
        });
        setError('⚠️ RPC endpoint unavailable (503 error). The public Solana RPC is down. Please use a reliable RPC provider like Helius. See RPC_SETUP.md for instructions.');
      } else {
        console.error('🔴 Other Error:', errorMsg);
        setError('Failed to fetch pool metadata: ' + errorMsg);
      }
    }
  }, [dlmmService, setSelectedPool]);

  const handlePreviewQuote = useCallback(async () => {
    setQuote(null);
    if (!selectedPool || !dlmmService) {
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
      const meta = await dlmmService.getPoolMetadata(selectedPool);
      
      // Try different property names the SDK might use
      const tokenX = meta?.tokenX || meta?.tokenMintX || meta?.baseMint || meta?.mintX;
      const tokenY = meta?.tokenY || meta?.tokenMintY || meta?.quoteMint || meta?.mintY;
      
      if (!tokenX || !tokenY) {
        throw new Error('Pool metadata incomplete - token addresses not found');
      }
      
      // Convert to string if they're PublicKey objects
      const tokenXStr = typeof tokenX === 'string' ? tokenX : tokenX.toString();
      const tokenYStr = typeof tokenY === 'string' ? tokenY : tokenY.toString();
      
      const tokenBase = formData.isTokenA ? tokenXStr : tokenYStr;
      const tokenQuote = formData.isTokenA ? tokenYStr : tokenXStr;
      
      // Get decimals from metadata, with fallback to 6
      const tokenBaseDecimal = meta?.extra?.tokenBaseDecimal ?? meta?.tokenXDecimal ?? meta?.baseDecimal ?? 6;
      const tokenQuoteDecimal = meta?.extra?.tokenQuoteDecimal ?? meta?.tokenYDecimal ?? meta?.quoteDecimal ?? 6;
      
      const uiAmount = Number(formData.amount);
      const amount = BigInt(Math.floor(uiAmount * Math.pow(10, tokenBaseDecimal)));
      const res = await dlmmService.getQuote({
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
    } catch (err: any) {
      console.error('Quote failed', err);
      const errorMsg = err?.message || String(err);
      if (errorMsg.includes('503') || errorMsg.includes('Service unavailable')) {
        setError('⚠️ RPC endpoint unavailable (503 error). The public Solana RPC is down. Please use a reliable RPC provider like Helius. See RPC_SETUP.md for instructions.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setQuoting(false);
    }
  }, [dlmmService, selectedPool, formData.amount, formData.isTokenA]);

  const validateForm = useCallback((): boolean => {
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
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!validateForm()) return;
    
    if (!selectedPool) {
      setError('Please select a pool first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createPosition({
        tokenA: formData.tokenA,
        tokenB: formData.tokenB,
        lowerBinId: Number(formData.lowerBinId),
        upperBinId: Number(formData.upperBinId),
        amount: Number(formData.amount),
        isTokenA: typeof formData.isTokenA === 'boolean' ? formData.isTokenA : formData.isTokenA === 'true',
      });

      if (result) {
        // Parse the result to get both signature and position address
        const positionResult = JSON.parse(result) as PositionCreationResult;
        
        setSuccess(
          `Position created successfully!\n` +
          `Position Address: ${positionResult.positionAddress}\n` +
          `Position Mint: ${positionResult.positionMint}\n` +
          `Transaction: ${positionResult.signature}`
        );

        // Reset form
        setFormData({
          tokenA: '',
          tokenB: '',
          amount: '',
          isTokenA: true,
          lowerBinId: '',
          upperBinId: '',
        });
        setQuote(null);
        onSuccess?.();
      } else {
        // Check if there's an error in the context
        if (contextError) {
          setError(`Position creation failed: ${contextError}`);
        } else {
          setError('Position creation failed - no result returned');
        }
      }
    } catch (err) {
      console.error('Position creation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create position';
      setError(errorMessage);
      onError?.(err as Error);
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, validateForm, selectedPool, createPosition, formData, contextError, onSuccess, onError]);

  if (!isClient) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border border-gray-700/100 rounded-xl"
      >
        <div className="text-lg text-gray-600">Loading...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 border-2 border-black/50 rounded-xl"
    >
      <div className="relative z-10">
        <h2 className="text-2xl text-gray-800 mb-6" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>
          Create New Position
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
          <pre className="whitespace-pre-wrap font-mono text-sm mb-4">{success}</pre>
          <div className="space-y-2 mb-4">
            {success.split('\n').map((line, index) => {
              if (line.includes('Transaction:')) {
                const signature = line.split('Transaction: ')[1];
                return (
                  <div key={index}>
                    <a
                      href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View Transaction on Solana Explorer
                    </a>
                  </div>
                );
              }
              if (line.includes('Position Address:')) {
                const address = line.split('Position Address: ')[1];
                return (
                  <div key={index}>
                    <a
                      href={`https://explorer.solana.com/address/${address}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View Position on Solana Explorer
                    </a>
                  </div>
                );
              }
              if (line.includes('Position Mint:')) {
                const mint = line.split('Position Mint: ')[1];
                return (
                  <div key={index}>
                    <a
                      href={`https://explorer.solana.com/address/${mint}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View Position Mint on Solana Explorer
                    </a>
                  </div>
                );
              }
              return null;
            })}
          </div>
          <a
            href="/dashboard"
            className="btn-secondary inline-block text-center"
          >
            Check Dashboard
          </a>
        </div>
      )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-3 items-end">
            <div className="col-span-2">
              <label className="form-label">Select Pool (optional)</label>
              <select
                value={selectedPool || ''}
                onChange={handleSelectPool}
                className="form-select"
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
              className={`btn-secondary ${loadingPools ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loadingPools ? 'Loading...' : 'Load Pools'}
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">
              Token A Address
            </label>
            <input
              type="text"
              name="tokenA"
              value={formData.tokenA}
              onChange={handleInputChange}
              placeholder="Enter Token A address"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Token B Address
            </label>
            <input
              type="text"
              name="tokenB"
              value={formData.tokenB}
              onChange={handleInputChange}
              placeholder="Enter Token B address"
              className="form-input"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
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
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Token
              </label>
              <select
                name="isTokenA"
                value={formData.isTokenA.toString()}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="true">Token A</option>
                <option value="false">Token B</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Lower Bin ID
              </label>
              <input
                type="number"
                name="lowerBinId"
                value={formData.lowerBinId}
                onChange={handleInputChange}
                placeholder="Enter lower bin ID"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Upper Bin ID
              </label>
              <input
                type="number"
                name="upperBinId"
                value={formData.upperBinId}
                onChange={handleInputChange}
                placeholder="Enter upper bin ID"
                className="form-input"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!connected || loading}
              className={`btn-primary ${
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
              className={`btn-secondary ${quoting || !selectedPool ? 'opacity-50 cursor-not-allowed' : ''}`}
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
      </div>
    </motion.div>
  );
};