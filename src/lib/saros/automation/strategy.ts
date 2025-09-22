import { IDLMMPosition, IPositionMetrics } from '../interfaces';
import { PositionHealthMonitor, IHealthMetrics } from '../position-health';

export interface AutomationStrategy {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    checkAndExecute(position: IDLMMPosition, metrics: IPositionMetrics): Promise<void>;
}

export interface AutomationRule {
    condition: (position: IDLMMPosition, metrics: IPositionMetrics, health: IHealthMetrics) => boolean;
    action: (position: IDLMMPosition, metrics: IPositionMetrics) => Promise<void>;
    description: string;
}

export class RebalancingStrategy implements AutomationStrategy {
    readonly id = 'auto-rebalance';
    readonly name = 'Auto Rebalancing';
    readonly description = 'Automatically rebalances position based on price movements and market conditions';

    private readonly healthMonitor: PositionHealthMonitor;

    constructor() {
        this.healthMonitor = new PositionHealthMonitor();
    }

    private rules: AutomationRule[] = [
        {
            // Rebalance when price moves significantly out of range
            condition: (position, metrics, health) => {
                const priceWarning = health.warnings.find(w => w.type === 'PRICE_RANGE_DEVIATION');
                return priceWarning?.severity === 'HIGH';
            },
            action: async (position, metrics) => {
                const currentPrice = metrics.priceRange.current;
                const spread = 0.1; // 10% spread around current price
                const newLowerBinId = Math.floor(currentPrice * (1 - spread));
                const newUpperBinId = Math.ceil(currentPrice * (1 + spread));
                
                await this.adjustPositionRange(position, newLowerBinId, newUpperBinId);
            },
            description: 'Rebalance position range around current price'
        },
        {
            // Add liquidity when utilization is too high
            condition: (_, metrics) => metrics.binUtilization > 90,
            action: async (position) => {
                const additionalLiquidity = position.tokenXDeposited * 0.2; // Add 20% more liquidity
                await this.addLiquidity(position, additionalLiquidity);
            },
            description: 'Add liquidity when utilization is high'
        },
        {
            // Reduce exposure when IL is too high
            condition: (_, metrics, health) => {
                const ilWarning = health.warnings.find(w => w.type === 'HIGH_IL_RISK');
                return ilWarning?.severity === 'HIGH';
            },
            action: async (position) => {
                const reductionAmount = position.tokenXDeposited * 0.3; // Reduce by 30%
                await this.removeLiquidity(position, reductionAmount);
            },
            description: 'Reduce exposure when IL risk is high'
        }
    ];

    async checkAndExecute(position: IDLMMPosition, metrics: IPositionMetrics): Promise<void> {
        const health = this.healthMonitor.calculateHealth(position, metrics);
        
        for (const rule of this.rules) {
            if (rule.condition(position, metrics, health)) {
                console.log(`Executing automation rule: ${rule.description}`);
                await rule.action(position, metrics);
            }
        }
    }

    private async adjustPositionRange(
        position: IDLMMPosition,
        newLowerBinId: number,
        newUpperBinId: number
    ): Promise<void> {
        // Implementation will use the SDK to adjust the position range
        // This is a placeholder for the actual SDK implementation
        console.log('Adjusting position range:', {
            positionId: position.address.toString(),
            newLowerBinId,
            newUpperBinId
        });
    }

    private async addLiquidity(
        position: IDLMMPosition,
        amount: number
    ): Promise<void> {
        // Implementation will use the SDK to add liquidity
        // This is a placeholder for the actual SDK implementation
        console.log('Adding liquidity:', {
            positionId: position.address.toString(),
            amount
        });
    }

    private async removeLiquidity(
        position: IDLMMPosition,
        amount: number
    ): Promise<void> {
        // Implementation will use the SDK to remove liquidity
        // This is a placeholder for the actual SDK implementation
        console.log('Removing liquidity:', {
            positionId: position.address.toString(),
            amount
        });
    }
}