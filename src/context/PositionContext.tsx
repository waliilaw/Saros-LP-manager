import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PositionManager } from '@/lib/saros/position-manager';
import { SarosDLMMService } from '@/lib/saros/dlmm-service';
import { IDLMMPosition, IPositionMetrics } from '@/lib/saros/interfaces';
import { SOLANA_RPC_ENDPOINT } from '@/lib/saros/config';
import { AutomationManager } from '@/lib/saros/automation/manager';
import { RebalancingStrategy } from '@/lib/saros/automation/strategy';
import { PriceFeedService, PriceData } from '@/lib/saros/price-feed';

interface PositionContextType {
    positions: IDLMMPosition[];
    positionMetrics: Map<string, IPositionMetrics>;
    loading: boolean;
    error: string | null;
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
    const [positions, setPositions] = useState<IDLMMPosition[]>([]);
    const [positionMetrics, setPositionMetrics] = useState<Map<string, IPositionMetrics>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize services
    const connection = new Connection(SOLANA_RPC_ENDPOINT);
    const dlmmService = new SarosDLMMService(connection);
    const positionManager = new PositionManager(dlmmService);
    
    // Initialize services
    const automationManager = new AutomationManager();
    const rebalancingStrategy = new RebalancingStrategy();
    automationManager.registerStrategy(rebalancingStrategy);

    const priceFeedService = new PriceFeedService();
    const [tokenPrices, setTokenPrices] = useState<Map<string, PriceData>>(new Map());

    const refreshPositions = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // In a real implementation, we would fetch user's positions
            // This is a placeholder for demo purposes
            const demoPositions: IDLMMPosition[] = [];
            const metrics = new Map<string, IPositionMetrics>();

            for (const position of demoPositions) {
                const positionMetrics = await positionManager.getPositionMetrics(position.address.toString());
                if (positionMetrics) {
                    metrics.set(position.address.toString(), positionMetrics);
                }
            }

            setPositions(demoPositions);
            setPositionMetrics(metrics);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch positions');
        } finally {
            setLoading(false);
        }
    };

    const createPosition = async (params: CreatePositionParams): Promise<string | null> => {
        try {
            setLoading(true);
            setError(null);

            // Implementation needed - integrate with wallet and transaction signing
            return null;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create position');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const adjustPosition = async (params: AdjustPositionParams): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            // Implementation needed - integrate with wallet and transaction signing
            return false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to adjust position');
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshPositions();
    }, []);

    return (
        <PositionContext.Provider
            value={{
                positions,
                positionMetrics,
                loading,
                error,
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