import { PublicKey } from '@solana/web3.js';
import { IDLMMPosition, IDLMMPool, IPositionMetrics } from './interfaces';
import { SarosDLMMService } from './dlmm-service';
import { PositionMetricsService } from './position-metrics';

export class PositionManager {
    private dlmmService: SarosDLMMService;
    private positionCache: Map<string, {
        position: IDLMMPosition;
        lastUpdated: number;
    }> = new Map();

    constructor(dlmmService: SarosDLMMService) {
        this.dlmmService = dlmmService;
    }

    async getPosition(positionId: string): Promise<IDLMMPosition | null> {
        // Check cache first
        const cached = this.positionCache.get(positionId);
        if (cached && Date.now() - cached.lastUpdated < 30000) { // 30s cache
            return cached.position;
        }

        const position = await this.dlmmService.getPosition(new PublicKey(positionId));
        if (position) {
            this.positionCache.set(positionId, {
                position,
                lastUpdated: Date.now()
            });
        }
        return position;
    }

    async getPositionMetrics(positionId: string): Promise<IPositionMetrics | null> {
        const position = await this.getPosition(positionId);
        if (!position) return null;

        const pool = await this.dlmmService.getPool(position.pool);
        if (!pool) return null;

        // Get current price from active bin
        const currentPrice = PositionMetricsService.calculateBinPrice(
            1, // Base price, should be fetched from oracle
            pool.activeId,
            pool.activeId
        );

        // Get initial price (when position was created)
        // This should ideally come from historical data
        const initialPrice = currentPrice; 

        return PositionMetricsService.getPositionMetrics(
            position,
            pool,
            currentPrice,
            initialPrice
        );
    }

    async shouldRebalance(positionId: string): Promise<{
        shouldRebalance: boolean;
        reason?: string;
        suggestedActions?: {
            newLowerBinId?: number;
            newUpperBinId?: number;
            addAmount?: number;
            removeAmount?: number;
        };
    }> {
        const metrics = await this.getPositionMetrics(positionId);
        if (!metrics) return { shouldRebalance: false };

        const position = await this.getPosition(positionId);
        if (!position) return { shouldRebalance: false };

        // Check various conditions that might trigger rebalancing
        const healthScore = PositionMetricsService.calculateHealthScore(
            position,
            (await this.dlmmService.getPool(position.pool))!,
            metrics.priceRange.current
        );

        if (healthScore < 50) {
            return {
                shouldRebalance: true,
                reason: 'Low health score',
                suggestedActions: this.calculateOptimalRange(position, metrics)
            };
        }

        if (metrics.binUtilization < 30) {
            return {
                shouldRebalance: true,
                reason: 'Low bin utilization',
                suggestedActions: this.calculateOptimalRange(position, metrics)
            };
        }

        return { shouldRebalance: false };
    }

    private calculateOptimalRange(
        position: IDLMMPosition,
        metrics: IPositionMetrics
    ): {
        newLowerBinId?: number;
        newUpperBinId?: number;
        addAmount?: number;
        removeAmount?: number;
    } {
        const currentPrice = metrics.priceRange.current;
        const volatilityRange = 0.2; // 20% range, should be calculated based on historical data

        const optimalLowerPrice = currentPrice * (1 - volatilityRange);
        const optimalUpperPrice = currentPrice * (1 + volatilityRange);

        // Convert prices to bin IDs
        const newLowerBinId = Math.floor(Math.log(optimalLowerPrice) / Math.log(1.0001));
        const newUpperBinId = Math.ceil(Math.log(optimalUpperPrice) / Math.log(1.0001));

        return {
            newLowerBinId,
            newUpperBinId
        };
    }
}