import { IDLMMPosition, IDLMMPool, IDLMMBin, IPositionMetrics } from './interfaces';
import { DEFAULT_BIN_STEP } from './config';

export class PositionMetricsService {
    /**
     * Calculate impermanent loss for a position
     * IL = 2√(P1/P0) / (1 + P1/P0) - 1
     * where P1 is current price and P0 is initial price
     */
    static calculateImpermanentLoss(
        initialPrice: number,
        currentPrice: number,
        positionValueAtEntry: number
    ): number {
        const priceRatio = currentPrice / initialPrice;
        const sqrtRatio = Math.sqrt(priceRatio);
        const il = (2 * sqrtRatio) / (1 + priceRatio) - 1;
        return il * positionValueAtEntry;
    }

    /**
     * Calculate the current TVL of a position
     */
    static calculateTotalValueLocked(
        position: IDLMMPosition,
        currentPriceX: number
    ): number {
        const valueX = Number(position.tokenXDeposited) * currentPriceX;
        const valueY = Number(position.tokenYDeposited);
        return valueX + valueY;
    }

    /**
     * Calculate APR based on fees earned and time elapsed
     */
    static calculateAPR(
        position: IDLMMPosition,
        currentPriceX: number
    ): number {
        const feesValueX = Number(position.feesEarnedX) * currentPriceX;
        const feesValueY = Number(position.feesEarnedY);
        const totalFeesValue = feesValueX + feesValueY;

        const timeElapsedSeconds = Date.now() / 1000 - position.lastUpdatedAt;
        const timeElapsedYears = timeElapsedSeconds / (365 * 24 * 60 * 60);

        const tvl = this.calculateTotalValueLocked(position, currentPriceX);
        
        return (totalFeesValue / tvl) / timeElapsedYears * 100;
    }

    /**
     * Calculate the utilization of bins in a position
     */
    static calculateBinUtilization(
        position: IDLMMPosition,
        pool: IDLMMPool
    ): number {
        const totalBins = position.upperBinId - position.lowerBinId + 1;
        const activeBins = position.liquidityShares.filter(shares => shares > BigInt(0)).length;
        return (activeBins / totalBins) * 100;
    }

    /**
     * Calculate the price for a specific bin ID
     */
    static calculateBinPrice(
        basePrice: number,
        binId: number,
        activeBinId: number
    ): number {
        const binStep = DEFAULT_BIN_STEP / 10000; // Convert from basis points
        const binDelta = binId - activeBinId;
        return basePrice * Math.pow(1 + binStep, binDelta);
    }

    /**
     * Calculate health score (0-100) based on multiple factors
     */
    static calculateHealthScore(
        position: IDLMMPosition,
        pool: IDLMMPool,
        currentPrice: number
    ): number {
        // Factor 1: Price position relative to range (0-40 points)
        const midPrice = this.calculateBinPrice(currentPrice, Math.floor((position.upperBinId + position.lowerBinId) / 2), pool.activeId);
        const priceDeviation = Math.abs(currentPrice - midPrice) / midPrice;
        const priceScore = Math.max(0, 40 * (1 - priceDeviation));

        // Factor 2: Bin utilization (0-30 points)
        const utilizationScore = this.calculateBinUtilization(position, pool) * 0.3;

        // Factor 3: APR performance (0-30 points)
        const apr = this.calculateAPR(position, currentPrice);
        const aprScore = Math.min(30, apr / 2); // Assuming 60% APR is excellent

        return priceScore + utilizationScore + aprScore;
    }

    /**
     * Get full position metrics
     */
    static async getPositionMetrics(
        position: IDLMMPosition,
        pool: IDLMMPool,
        currentPrice: number,
        initialPrice: number
    ): Promise<IPositionMetrics> {
        const tvl = this.calculateTotalValueLocked(position, currentPrice);
        
        return {
            impermanentLoss: this.calculateImpermanentLoss(initialPrice, currentPrice, tvl),
            totalValueLocked: tvl,
            apr: this.calculateAPR(position, currentPrice),
            volumeLast24h: 0, // Would need historical data
            feesLast24h: 0, // Would need historical data
            binUtilization: this.calculateBinUtilization(position, pool),
            priceRange: {
                min: this.calculateBinPrice(currentPrice, position.lowerBinId, pool.activeId),
                max: this.calculateBinPrice(currentPrice, position.upperBinId, pool.activeId),
                current: currentPrice
            }
        };
    }
}