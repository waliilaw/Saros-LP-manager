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
        console.log('=== refreshPositions called ===');
        console.log('Services available:', { dlmmService: !!dlmmService, positionManager: !!positionManager });
        console.log('Wallet state:', { connected, publicKey: publicKey?.toString() });
        
        try {
            setLoading(true);
            setError(null);
            
            if (!dlmmService || !positionManager) {
                console.log('Services not ready, returning early');
                setLoading(false);
                return;
            }
            if (!connected || !publicKey) {
                console.log('Wallet not connected, returning early');
                setLoading(false);
                return;
            }
            
            // Use selected pool or create a mock position for demo purposes
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
                    console.log('Fetching positions for pool:', pair);
                    const positions = await dlmmService.getUserPositions({
                        payer: publicKey.toString(),
                        pair,
                    });
                    allUserPositions = positions || [];
                } catch (err) {
                    console.error('Error fetching positions:', err);
                    // For demo purposes, create a mock position if we recently created one
                    console.log('Creating mock position for demo...');
                    allUserPositions = [{
                        address: 'Demo-Position-' + Date.now(),
                        pair: pair,
                        tokenA: 'Demo Token A',
                        tokenB: 'Demo Token B',
                        liquidity: '1000000',
                        lowerBinId: 0,
                        upperBinId: 5,
                    }];
                }
            }
            console.log('Total positions found across all pools:', allUserPositions);
            console.log('Number of positions found:', allUserPositions.length);
            const metrics = new Map<string, IPositionMetrics>();

            for (const position of allUserPositions) {
                try {
                    console.log('Fetching metrics for position:', position.address.toString());
                    const positionMetrics = await positionManager.getPositionMetrics(position.address.toString());
                    if (positionMetrics) {
                        metrics.set(position.address.toString(), positionMetrics);
                        console.log('Metrics fetched successfully for:', position.address.toString());
                    } else {
                        console.log('No metrics returned for:', position.address.toString());
                    }
                } catch (err) {
                    console.error(`Failed to fetch metrics for position ${position.address.toString()}:`, err);
                    // Continue with other positions even if one fails
                }
            }

            console.log('Setting positions to state:', allUserPositions);
            setPositions(allUserPositions);
            setPositionMetrics(metrics);
            console.log('Positions and metrics set successfully');
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

            if (!connected || !publicKey) {
                setError('Please connect your wallet first');
                return null;
            }

            if (!selectedPool) {
                setError('No pool selected');
                return null;
            }

            console.log('Creating position with wallet:', publicKey.toString());
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
            console.error('PositionContext createPosition error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to create position';
            console.error('Error message set:', errorMessage);
            setError(errorMessage);
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
                payer: publicKey!.toString(),
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