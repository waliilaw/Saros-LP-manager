'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { PositionManager } from '@/lib/saros/position-manager';
import { SarosDLMMService } from '@/lib/saros/dlmm-service';
import { IDLMMPosition, IPositionMetrics } from '@/lib/saros/interfaces';
import { SOLANA_RPC_ENDPOINT, SOLANA_NETWORK } from '@/lib/saros/config';
import { AutomationManager } from '@/lib/saros/automation/manager';
import { RebalancingStrategy } from '@/lib/saros/automation/strategy';
import { PriceFeedService, PriceData } from '@/lib/saros/price-feed';
import { useWallet } from '@/context/WalletContext';

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

const PositionContext = createContext<PositionContextType | null>(null) ;

export function PositionProvider({ children }: { children: ReactNode }) {
    const { publicKey, connected, signAndSendTransaction } = useWallet();
    const [positions, setPositions] = useState<IDLMMPosition[]>([]);
    const [positionMetrics, setPositionMetrics] = useState<Map<string, IPositionMetrics>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPool, setSelectedPool] = useState<string | null>(null);

    // Initialize services
    const connection = useMemo(() => {
        if (typeof window === 'undefined') return null;
        return new Connection(SOLANA_RPC_ENDPOINT || clusterApiUrl(SOLANA_NETWORK));
    }, []);

    const dlmmService = useMemo(() => {
        if (!connection) return null;
        return new SarosDLMMService(connection);
    }, [connection]);

    const positionManager = useMemo(() => {
        if (!dlmmService) return null;
        return new PositionManager(dlmmService);
    }, [dlmmService]);
    
    // Initialize services
    const rebalancingStrategy = useMemo(() => {
        if (!dlmmService) return null;
        return new RebalancingStrategy(dlmmService);
    }, [dlmmService]);

    const automationManager = useMemo(() => {
        const manager = new AutomationManager();
        if (rebalancingStrategy) {
            manager.registerStrategy(rebalancingStrategy);
        }
        return manager;
    }, [rebalancingStrategy]);

    const priceFeedService = useMemo(() => new PriceFeedService(), []);
    const [tokenPrices, setTokenPrices] = useState<Map<string, PriceData>>(new Map());

    const refreshPositions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            if (!dlmmService || !positionManager) {
                // Don't show error immediately, services might still be initializing
                setLoading(false);
                return;
            }
            if (!connected || !publicKey) {
                // Only show error if user has attempted to connect but failed
                // Don't show error on initial load when wallet isn't connected yet
                setLoading(false);
                return;
            }
            
            // Use selected pool or choose default (first available pool)
            let pair = selectedPool;
            if (!pair) {
                const pools = await dlmmService.fetchPoolAddresses();
                pair = pools && pools.length > 0 ? pools[0] : null;
                if (pair && !selectedPool) {
                    setSelectedPool(pair);
                }
            }
            if (!pair) {
                setPositions([]);
                setPositionMetrics(new Map());
                return;
            }

            // Fetch user's positions from the DLMM service
            const userPositions = await dlmmService.getUserPositions({
                payer: publicKey.toString(),
                pair,
            });
            const metrics = new Map<string, IPositionMetrics>();

            for (const position of userPositions) {
                try {
                    const positionMetrics = await positionManager.getPositionMetrics(position.address.toString());
                    if (positionMetrics) {
                        metrics.set(position.address.toString(), positionMetrics);
                    }
                } catch (err) {
                    console.error(`Failed to fetch metrics for position ${position.address.toString()}:`, err);
                    // Continue with other positions even if one fails
                }
            }

            setPositions(userPositions);
            setPositionMetrics(metrics);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch positions');
        } finally {
            setLoading(false);
        }
    }, [dlmmService, positionManager]);

    const createPosition = useCallback(async (params: CreatePositionParams): Promise<string | null> => {
        try {
            setLoading(true);
            setError(null);

            if (!dlmmService) {
                setError('Service not initialized');
                return null;
            }

            const position = await dlmmService.createPosition({
                selectedPool: selectedPool!,
                tokenA: params.tokenA,
                tokenB: params.tokenB,
                lowerBinId: params.lowerBinId,
                upperBinId: params.upperBinId,
                amount: params.amount,
                isTokenA: params.isTokenA,
                payer: publicKey!.toString(),
                signAndSendTransaction,
            });

            if (!position) {
                throw new Error('Failed to create position');
            }

            await refreshPositions();
            return position.address.toString();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create position');
            return null;
        } finally {
            setLoading(false);
        }
    }, [dlmmService, refreshPositions]);

    const adjustPosition = useCallback(async (params: AdjustPositionParams): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            if (!dlmmService) {
                setError('Service not initialized');
                return false;
            }

            const position = positions.find(p => p.address.toString() === params.positionId);
            if (!position) {
                throw new Error('Position not found');
            }

            const success = await dlmmService.adjustPosition({
                position,
                newLowerBinId: params.newLowerBinId,
                newUpperBinId: params.newUpperBinId,
                addAmount: params.addAmount,
                removeAmount: params.removeAmount,
                payer: publicKey!.toString(),
                signAndSendTransaction,
            });

            if (success) {
                await refreshPositions();
            }

            return success;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to adjust position');
            return false;
        } finally {
            setLoading(false);
        }
    }, [dlmmService, positions, refreshPositions]);

    useEffect(() => {
        refreshPositions();
    }, [refreshPositions]);

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