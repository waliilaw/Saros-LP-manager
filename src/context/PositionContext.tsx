'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { PositionManager } from '@/lib/saros/position-manager';
import { SarosDLMMService } from '@/lib/saros/dlmm-service';
import { IDLMMPosition, IPositionMetrics } from '@/lib/saros/interfaces';
import { SOLANA_RPC_ENDPOINT, SOLANA_NETWORK } from '@/lib/saros/config';
import { AutomationManager } from '@/lib/saros/automation/manager';
import { AutomationStrategy, IRebalancingStrategy } from '@/lib/saros/automation/strategy';
import { PriceFeedService, PriceData } from '@/lib/saros/price-feed';
import { useWallet } from '@/context/WalletContext';

interface PositionCreationResult {
  signature: string;
  positionAddress: string;
  positionMint: string;
}

interface PositionContextType {
  positions: IDLMMPosition[];
  positionMetrics: Map<string, IPositionMetrics>;
  loading: boolean;
  error: string | null;
  selectedPool: string | null;
  setSelectedPool: (pool: string | null) => void;
  refreshPositions: () => Promise<void>;
  createPosition: (params: CreatePositionParams) => Promise<string | null>;
  adjustPosition: (params: AdjustPositionParams) => Promise<boolean>;
  automationManager: AutomationManager;
  priceFeedService: PriceFeedService;
  tokenPrices: Map<string, PriceData>;
}

interface CreatePositionParams {
  tokenA: string;
  tokenB: string;
  lowerBinId: number;
  upperBinId: number;
  amount: number;
  isTokenA: boolean;
}

interface AdjustPositionParams {
  positionId: string;
  newLowerBinId?: number;
  newUpperBinId?: number;
  addAmount?: number;
  removeAmount?: number;
}

const PositionContext = createContext<PositionContextType | null>(null);

export function PositionProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [positions, setPositions] = useState<IDLMMPosition[]>([]);
  const [positionMetrics, setPositionMetrics] = useState<Map<string, IPositionMetrics>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [tokenPrices, setTokenPrices] = useState<Map<string, PriceData>>(new Map());
  const { connection, publicKey, connected, signAndSendTransaction } = useWallet();

  useEffect(() => {
    setIsClient(true);
    // Load positions from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedPositions = localStorage.getItem('saros-positions');
      const savedMetrics = localStorage.getItem('saros-metrics');
      if (savedPositions) {
        try {
          setPositions(JSON.parse(savedPositions));
        } catch (e) {
          console.error('Failed to load positions from localStorage', e);
        }
      }
      if (savedMetrics) {
        try {
          const metricsObj = JSON.parse(savedMetrics);
          const metricsMap: any = new Map(Object.entries(metricsObj));
          setPositionMetrics(metricsMap);
        } catch (e) {
          console.error('Failed to load metrics from localStorage', e);
        }
      }
    }
  }, []);

  // Save positions to localStorage whenever they change
  useEffect(() => {
    if (isClient && positions.length > 0) {
      localStorage.setItem('saros-positions', JSON.stringify(positions));
    }
  }, [positions, isClient]);

  // Save metrics to localStorage whenever they change
  useEffect(() => {
    if (isClient && positionMetrics.size > 0) {
      const metricsObj = Object.fromEntries(positionMetrics);
      localStorage.setItem('saros-metrics', JSON.stringify(metricsObj));
    }
  }, [positionMetrics, isClient]);

  // Initialize services
  const dlmmService = useMemo(() => {
    if (!connection || !isClient) return null;
    return new SarosDLMMService(connection);
  }, [connection, isClient]);

  const positionManager : any  = useMemo(() => {
    if (!dlmmService) return null;
    return new PositionManager(dlmmService);
  }, [dlmmService]);

  const rebalancingStrategy = useMemo(() => {
    if (!dlmmService) return null;
    return new AutomationStrategy();
  }, [dlmmService]);

  const automationManager = useMemo(() => {
    const manager = new AutomationManager();
    if (rebalancingStrategy) {
      manager.registerStrategy(rebalancingStrategy);
    }
    return manager;
  }, [rebalancingStrategy]);

  const priceFeedService = useMemo(() => new PriceFeedService(), []);

  const refreshPositions = useCallback(async () => {
    if (!isClient || !dlmmService || !positionManager || !connected || !publicKey) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let pair = selectedPool;
      if (!pair) {
        try {
          const pools = await dlmmService.fetchPoolAddresses();
          pair = pools && pools.length > 0 ? pools[0] : null;
          if (pair) {
            setSelectedPool(pair);
          }
        } catch (err) {
          console.error('Failed to fetch pools:', err);
        }
      }

      let allUserPositions: any[] = [];

      if (pair) {
        try {
          console.log('Fetching positions for:', { payer: publicKey.toString(), pair });
          const positions = await dlmmService.getUserPositions({
            payer: publicKey.toString(),
            pair,
          });
          console.log('Fetched positions:', positions);
          allUserPositions = positions || [];
        } catch (err) {
          console.error('Error fetching positions:', err);
          allUserPositions = [];
        }
      }

      const metrics = new Map<string, IPositionMetrics>();

      for (const position of allUserPositions) {
        try {
          console.log(`Fetching metrics for position: ${position.address.toString()}`);
          const positionMetrics = await positionManager.getPositionMetrics(position.address.toString());
          if (positionMetrics) {
            console.log(`Got metrics for ${position.address.toString()}:`, positionMetrics);
            metrics.set(position.address.toString(), positionMetrics);
          } else {
            console.log(`No metrics returned for ${position.address.toString()}, skipping`);
          }
        } catch (err) {
          console.error(`Failed to fetch metrics for position ${position.address.toString()}:`, err);
          // Don't add fake metrics - just skip this position's metrics
        }
      }

      setPositions(allUserPositions);
      setPositionMetrics(metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  }, [dlmmService, positionManager, connected, publicKey, selectedPool, isClient]);

  const createPosition = useCallback(async (params: CreatePositionParams): Promise<string | null> => {
    if (!isClient || !dlmmService || !connected || !publicKey || !signAndSendTransaction) {
      setError('Services not initialized or wallet not connected');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      if (!selectedPool) {
        setError('No pool selected');
        return null;
      }

      const result = await dlmmService.createPosition({
        selectedPool: selectedPool,
        tokenA: params.tokenA,
        tokenB: params.tokenB,
        lowerBinId: params.lowerBinId,
        upperBinId: params.upperBinId,
        amount: params.amount,
        isTokenA: params.isTokenA,
        payer: publicKey.toString(),
        signAndSendTransaction,
      });

      if (!result) {
        throw new Error('Failed to create position');
      }

      // Add the newly created position to state immediately
      const newPosition = {
        address: result.address.toString(),
        pair: selectedPool,
        tokenA: params.tokenA,
        tokenB: params.tokenB,
        liquidity: params.amount,
        lowerBinId: params.lowerBinId,
        upperBinId: params.upperBinId,
        healthFactor: 1.5,
      };

      // Update state immediately with the new position
      setPositions((prev : any) => [...prev, newPosition]);

      // Fetch real metrics for the new position
      try {
        const realMetrics = await positionManager.getPositionMetrics(result.address.toString());
        if (realMetrics) {
          setPositionMetrics(prev => {
            const newMap = new Map(prev);
            newMap.set(result.address.toString(), realMetrics);
            return newMap;
          });
        }
      } catch (err) {
        console.error('Failed to fetch metrics for new position:', err);
      }

      // Also refresh in background to sync all data
      refreshPositions().catch(console.error);

      // Return result in the correct format
      const positionResult: PositionCreationResult = {
        signature: result.signature,
        positionAddress: result.address.toString(),
        positionMint: result.positionMint.toString(),
      };

      return JSON.stringify(positionResult);
    } catch (err) {
      console.error('Position creation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create position';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [dlmmService, connected, publicKey, signAndSendTransaction, selectedPool, refreshPositions, isClient]);

  const adjustPosition = useCallback(async (params: AdjustPositionParams): Promise<boolean> => {
    if (!isClient || !dlmmService || !connected || !publicKey || !signAndSendTransaction) {
      setError('Services not initialized or wallet not connected');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const position = positions.find(p => p.address.toString() === params.positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      const result = await dlmmService.adjustPosition({
        position: {
          ...position,
          address: position.address.toString(),
          pair: position.pair.toString(),
        },
        newLowerBinId: params.newLowerBinId,
        newUpperBinId: params.newUpperBinId,
        addAmount: params.addAmount,
        removeAmount: params.removeAmount,
        payer: publicKey.toString(),
        signAndSendTransaction,
      });

      if (result.success) {
        await refreshPositions();
      }

      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust position');
      return false;
    } finally {
      setLoading(false);
    }
  }, [dlmmService, positions, refreshPositions, connected, publicKey, signAndSendTransaction, isClient]);

  if (!isClient) {
    return (
      <PositionContext.Provider
        value={{
          positions: [],
          positionMetrics: new Map(),
          loading: true,
          error: null,
          selectedPool: null,
          setSelectedPool: () => {},
          refreshPositions: async () => {},
          createPosition: async () => null,
          adjustPosition: async () => false,
          automationManager,
          priceFeedService,
          tokenPrices,
        }}
      >
        {children}
      </PositionContext.Provider>
    );
  }

  return (
    <PositionContext.Provider
      value={{
        positions,
        positionMetrics,
        loading,
        error,
        selectedPool,
        setSelectedPool,
        refreshPositions,
        createPosition,
        adjustPosition,
        automationManager,
        priceFeedService,
        tokenPrices,
      }}
    >
      {children}
    </PositionContext.Provider>
  );
}

export function usePositions() {
  const context = useContext(PositionContext);
  if (!context) {
    throw new Error('usePositions must be used within a PositionProvider');
  }
  return context;
}