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
        const health = await this.healthMonitor.evaluateHealth(metrics);

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

    public async adjustPositionRange(position: IDLMMPosition, metrics: any): Promise<void> {
        // TODO: Temporarily disabled for demo - would need payer and signAndSendTransaction parameters
        console.log('adjustPositionRange called but disabled for demo');
    }

    public async addLiquidity(position: IDLMMPosition, metrics: any): Promise<void> {
        // TODO: Temporarily disabled for demo - would need payer and signAndSendTransaction parameters
        console.log('addLiquidity called but disabled for demo');
    }

    public async removeLiquidity(position: IDLMMPosition, metrics: any): Promise<void> {
        // TODO: Temporarily disabled for demo - would need payer and signAndSendTransaction parameters
        console.log('removeLiquidity called but disabled for demo');
    }

    private shouldAdjustRange(health: IHealthMetrics): boolean {
        return health.warnings.some(w => w.type === 'PRICE_RANGE_DEVIATION' && w.severity === 'HIGH');
    }

    private shouldAddLiquidity(metrics: any ): boolean {
        return metrics.binUtilization > 90;
    }

    private shouldRemoveLiquidity(health: IHealthMetrics): boolean {
        return health.warnings.some(w => w.type === 'HIGH_IL_RISK' && w.severity === 'HIGH');
    }
}