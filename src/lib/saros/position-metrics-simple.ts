import { IDLMMPosition, IPositionMetrics } from './interfaces';
import { DEFAULT_BIN_STEP } from './config';

export class PositionMetricsService {
    /**
     * Simplified position metrics service for demo
     * All methods return mock data to avoid interface mismatches
     */
    static calculateImpermanentLoss(
        initialPrice: number,
        currentPrice: number,
        positionValueAtEntry: number
    ): number {
        return 0; // Simplified for demo
    }

    static calculatePositionValue(
        position: IDLMMPosition,
        currentPriceX: number
    ): number {
        return 1000; // Simplified for demo
    }

    static calculateFeesEarned(
        position: IDLMMPosition,
        currentPriceX: number,
        timeframe: number = 24
    ): { total: number; hourly: number } {
        return { total: 50, hourly: 2.1 }; // Simplified for demo
    }

    static calculateUtilization(
        position: IDLMMPosition,
        pool: any
    ): number {
        return 0.75; // Simplified for demo
    }

    static calculateBinPrice(
        basePrice: number,
        binId: number,
        activeBinId: number,
        binStep: number = DEFAULT_BIN_STEP
    ): number {
        return basePrice; // Simplified for demo
    }

    static calculateHealthScore(
        position: IDLMMPosition,
        pool: any,
        currentPrice: number
    ): number {
        return 85; // Simplified for demo
    }

    static async getMetrics(
        position: IDLMMPosition,
        pool: any,
        currentPrice: number,
        timeframe: number = 24
    ): Promise<IPositionMetrics> {
        return {
            feesEarned: 50,
            volume24h: 1000,
            apr: 5.5,
            impermanentLoss: 0,
            priceRange: {
                lower: 100,
                upper: 200,
            },
            utilization: 0.75,
            healthScore: 85
        };
    }
}