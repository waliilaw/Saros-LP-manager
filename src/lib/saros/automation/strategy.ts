import { IDLMMPosition, IPositionMetrics } from '../interfaces';
import { IHealthMetrics, PositionHealthMonitor } from '../position-health';
import { SarosDLMMService } from '../dlmm-service';

export interface IRebalancingStrategy {
    id: string;
    name: string;
    description: string;
    checkAndExecute(position: IDLMMPosition, metrics: IPositionMetrics): Promise<void>;
    adjustPositionRange(position: IDLMMPosition, metrics: IPositionMetrics): Promise<void>;
    addLiquidity(position: IDLMMPosition, metrics: IPositionMetrics): Promise<void>;
    removeLiquidity(position: IDLMMPosition, metrics: IPositionMetrics): Promise<void>;
}

export class RebalancingStrategy implements IRebalancingStrategy {
    private healthMonitor: PositionHealthMonitor;
    private dlmmService: SarosDLMMService;
    public readonly id = 'auto-rebalance';
    public readonly name = 'Auto Rebalancing';
    public readonly description = 'Automatically rebalances positions based on market conditions';

    constructor(dlmmService: SarosDLMMService) {
        this.healthMonitor = new PositionHealthMonitor();
        this.dlmmService = dlmmService;
    }

    public async checkAndExecute(position: IDLMMPosition, metrics: IPositionMetrics): Promise<void> {
        const health = await this.healthMonitor.calculateHealth(position, metrics);

        if (this.shouldAdjustRange(health)) {
            await this.adjustPositionRange(position, metrics);
        }

        if (this.shouldAddLiquidity(metrics)) {
            await this.addLiquidity(position, metrics);
        }

        if (this.shouldRemoveLiquidity(health)) {
            await this.removeLiquidity(position, metrics);
        }
    }

    public async adjustPositionRange(position: IDLMMPosition, metrics: IPositionMetrics): Promise<void> {
        const currentPrice = metrics.priceRange.current;
        const newLowerBinId = Math.floor(currentPrice * 0.9); // 10% below current price
        const newUpperBinId = Math.ceil(currentPrice * 1.1); // 10% above current price

        await this.dlmmService.adjustPosition({
            position,
            newLowerBinId,
            newUpperBinId
        });
    }

    public async addLiquidity(position: IDLMMPosition, metrics: IPositionMetrics): Promise<void> {
        const optimalAmount = metrics.totalValueLocked * 0.1; // Add 10% of current TVL
        await this.dlmmService.adjustPosition({
            position,
            addAmount: optimalAmount
        });
    }

    public async removeLiquidity(position: IDLMMPosition, metrics: IPositionMetrics): Promise<void> {
        const removeAmount = metrics.totalValueLocked * 0.2; // Remove 20% of current TVL
        await this.dlmmService.adjustPosition({
            position,
            removeAmount
        });
    }

    private shouldAdjustRange(health: IHealthMetrics): boolean {
        return health.warnings.some(w => w.type === 'PRICE_RANGE_DEVIATION' && w.severity === 'HIGH');
    }

    private shouldAddLiquidity(metrics: IPositionMetrics): boolean {
        return metrics.binUtilization > 90;
    }

    private shouldRemoveLiquidity(health: IHealthMetrics): boolean {
        return health.warnings.some(w => w.type === 'HIGH_IL_RISK' && w.severity === 'HIGH');
    }
}