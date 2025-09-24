import { IRebalancingStrategy, RebalanceParams } from './strategy';

export class AutomationManager {
  private strategiesMap: Map<string, IRebalancingStrategy> = new Map();
  private activeStrategies: Map<string, string> = new Map(); // positionId -> strategyName

  constructor() {}

  registerStrategy(strategy: IRebalancingStrategy): void {
    this.strategiesMap.set(strategy.name, strategy);
  }

  async activateStrategy(positionId: string, strategyName: string, params: RebalanceParams): Promise<boolean> {
    const strategy = this.strategiesMap.get(strategyName);
    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }

    try {
      const shouldRebalance = await strategy.evaluate(params);
      if (shouldRebalance) {
        const success = await strategy.execute(params);
        if (success) {
          this.activeStrategies.set(positionId, strategyName);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(`Failed to activate strategy ${strategyName} for position ${positionId}:`, error);
      return false;
    }
  }

  deactivateStrategy(positionId: string): void {
    this.activeStrategies.delete(positionId);
  }

  getActiveStrategy(positionId: string): string | undefined {
    return this.activeStrategies.get(positionId);
  }

  get strategies(): IRebalancingStrategy[] {
    return Array.from(this.strategiesMap.values());
  }

  async checkAndExecuteStrategies(positions: Map<string, RebalanceParams>): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [positionId, params] of positions.entries()) {
      const strategyName = this.activeStrategies.get(positionId);
      if (!strategyName) continue;

      const strategy = this.strategiesMap.get(strategyName);
      if (!strategy) continue;

      try {
        const shouldRebalance = await strategy.evaluate(params);
        if (shouldRebalance) {
          const success = await strategy.execute(params);
          results.set(positionId, success);
        } else {
          results.set(positionId, false);
        }
      } catch (error) {
        console.error(`Failed to execute strategy for position ${positionId}:`, error);
        results.set(positionId, false);
      }
    }

    return results;
  }
}