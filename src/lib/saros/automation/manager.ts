import { IRebalancingStrategy } from './strategy';
import { IDLMMPosition, IPositionMetrics } from '../interfaces';
import { NotificationManager } from '../../notifications/manager';

export class AutomationManager {
    private strategiesMap: Map<string, IRebalancingStrategy> = new Map();

    get strategies(): Map<string, IRebalancingStrategy> {
        return this.strategiesMap;
    }
    private activeStrategies: Map<string, Set<string>> = new Map(); // positionId -> strategy ids

    registerStrategy(strategy: IRebalancingStrategy) {
        this.strategiesMap.set(strategy.id, strategy);
    }

    activateStrategy(positionId: string, strategyId: string) {
        if (!this.strategies.has(strategyId)) {
            throw new Error(`Strategy ${strategyId} not found`);
        }

        if (!this.activeStrategies.has(positionId)) {
            this.activeStrategies.set(positionId, new Set());
        }

        this.activeStrategies.get(positionId)!.add(strategyId);
    }

    deactivateStrategy(positionId: string, strategyId: string) {
        const strategies = this.activeStrategies.get(positionId);
        if (strategies) {
            strategies.delete(strategyId);
        }
    }

    getActiveStrategies(positionId: string): IRebalancingStrategy[] {
        const strategyIds = this.activeStrategies.get(positionId) || new Set();
        return Array.from(strategyIds)
            .map(id => this.strategies.get(id)!)
            .filter(Boolean);
    }

    async executeStrategies(position: IDLMMPosition, metrics: IPositionMetrics): Promise<void> {
        const strategies = this.getActiveStrategies(position.address.toString());
        const notificationManager = NotificationManager.getInstance();
        
        await Promise.all(
            strategies.map(async strategy => {
                try {
                    await strategy.checkAndExecute(position, metrics);
                    notificationManager.addNotification({
                        type: 'success',
                        title: `Strategy Executed: ${strategy.name}`,
                        message: `Successfully executed ${strategy.name} for position ${position.address.toString().slice(0, 8)}`,
                        positionId: position.address.toString()
                    });
                } catch (error) {
                    console.error(`Strategy ${strategy.id} failed:`, error);
                    notificationManager.addNotification({
                        type: 'error',
                        title: `Strategy Failed: ${strategy.name}`,
                        message: `Failed to execute ${strategy.name} for position ${position.address.toString().slice(0, 8)}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        positionId: position.address.toString()
                    });
                }
            })
        );
    }
}