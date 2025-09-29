import { Connection, PublicKey } from '@solana/web3.js';
import { LiquidityBookServices, MODE } from '@saros-finance/dlmm-sdk';
import { IDLMMPosition, IPositionMetrics } from './interfaces';
import { SOLANA_RPC_ENDPOINT } from './config';

interface PoolMetadata {
    binStep: number;
    activeId: number;
    volume24h?: number;
    priceChange24h?: number;
    [key: string]: any;
}

interface Bin {
    liquidity: number;
    amountX: number;
    amountY: number;
    volume24h?: number;
    fees?: number;
    [key: string]: any;
}

interface PoolEvent {
    type: string;
    fees?: number;
    volume?: number;
    price?: number;
    timestamp: number;
    [key: string]: any;
}

export class PositionMetricsService {
    private static lb: LiquidityBookServices;
    private static connection: Connection;

    private static initialize() {
        if (!this.lb) {
            this.connection = new Connection(SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com');
            this.lb = new LiquidityBookServices({
                mode: MODE.DEVNET,
                options: { 
                    rpcUrl: SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com'
                },
            });
        }
    }

    static calculateImpermanentLoss(
        initialPrice: number,
        currentPrice: number,
        positionValueAtEntry: number
    ): number {
        // Calculate IL using constant product formula
        const priceRatio = currentPrice / initialPrice;
        const sqrtRatio = Math.sqrt(priceRatio);
        const il = 2 * sqrtRatio / (1 + priceRatio) - 1;
        return il * positionValueAtEntry;
    }

    static async calculatePositionValue(
        position: IDLMMPosition,
        currentPriceX: number
    ): Promise<number> {
        this.initialize();

        try {
            const poolMetadata = await this.lb.fetchPoolMetadata(position.pair.toString()) as unknown as PoolMetadata;
            if (!poolMetadata) return 0;

            const binStep = poolMetadata.binStep || 0;
            let totalValue = 0;

            // Get all bins in position range
            for (let binId = position.lowerBinId; binId <= position.upperBinId; binId++) {
                const bin = await (this.lb as any).fetchBin(position.pair.toString(), binId) as Bin;
                if (!bin) continue;

                const binPrice = Math.pow(1 + binStep, binId);
                const binValueX = bin.amountX * currentPriceX;
                const binValueY = bin.amountY * binPrice;
                
                totalValue += binValueX + binValueY;
            }

            return totalValue;
        } catch (error) {
            console.error('Failed to calculate position value:', error);
            return 0;
        }
    }

    static async calculateFeesEarned(
        position: IDLMMPosition,
        currentPriceX: number,
        timeframe: number = 24
    ): Promise<{ total: number; hourly: number }> {
        this.initialize();

        try {
            const events = await (this.lb as any).fetchPoolEvents(position.pair.toString(), {
                startTime: Date.now() - timeframe * 60 * 60 * 1000,
                endTime: Date.now(),
            }) as PoolEvent[];

            if (!events) return { total: 0, hourly: 0 };

            let totalFees = 0;
            events.forEach((event: PoolEvent) => {
                if (event.type === 'swap' && event.fees) {
                    totalFees += event.fees;
                }
            });

            return {
                total: totalFees,
                hourly: totalFees / timeframe,
            };
        } catch (error) {
            console.error('Failed to calculate fees earned:', error);
            return { total: 0, hourly: 0 };
        }
    }

    static async calculateUtilization(
        position: IDLMMPosition,
        poolAddress: string
    ): Promise<number> {
        this.initialize();

        try {
            const poolMetadata = await this.lb.fetchPoolMetadata(poolAddress) as unknown as PoolMetadata;
            if (!poolMetadata) return 0;

            let totalLiquidity = 0;
            let usedLiquidity = 0;

            // Calculate utilization for each bin in position range
            for (let binId = position.lowerBinId; binId <= position.upperBinId; binId++) {
                const bin = await (this.lb as any).fetchBin(poolAddress, binId) as Bin;
                if (!bin) continue;

                totalLiquidity += bin.liquidity || 0;
                if (binId === poolMetadata.activeId) {
                    usedLiquidity += bin.liquidity || 0;
                }
            }

            return totalLiquidity > 0 ? usedLiquidity / totalLiquidity : 0;
        } catch (error) {
            console.error('Failed to calculate utilization:', error);
            return 0;
        }
    }

    static calculateBinPrice(
        basePrice: number,
        binId: number,
        activeBinId: number,
        binStep: number
    ): number {
        return basePrice * Math.pow(1 + binStep, binId - activeBinId);
    }

    static async calculateHealthScore(
        position: IDLMMPosition,
        poolAddress: string,
        currentPrice: number
    ): Promise<number> {
        this.initialize();

        try {
            const poolMetadata = await this.lb.fetchPoolMetadata(poolAddress) as unknown as PoolMetadata;
            if (!poolMetadata) return 0;

            const binStep = poolMetadata.binStep || 0;
            const activeId = poolMetadata.activeId || 0;

            // Calculate distance from active bin
            const positionCenter = (position.upperBinId + position.lowerBinId) / 2;
            const deviation = Math.abs(positionCenter - activeId);

            // Calculate price range coverage
            const rangeCoverage = (position.upperBinId - position.lowerBinId) / (binStep * 100);

            // Calculate liquidity distribution
            let liquidityScore = 0;
            for (let binId = position.lowerBinId; binId <= position.upperBinId; binId++) {
                const bin = await (this.lb as any).fetchBin(poolAddress, binId) as Bin;
                if (!bin) continue;
                liquidityScore += bin.liquidity || 0;
            }

            // Combine factors into health score (0-100)
            const deviationScore = Math.max(0, 100 - (deviation * 2));
            const coverageScore = Math.min(100, rangeCoverage * 50);
            const liquidityWeight = Math.min(100, (liquidityScore / 1000) * 100);

            return (deviationScore * 0.4 + coverageScore * 0.3 + liquidityWeight * 0.3);
        } catch (error) {
            console.error('Failed to calculate health score:', error);
            return 0;
        }
    }

    static async getMetrics(
        position: IDLMMPosition,
        poolAddress: string,
        currentPrice: number,
        timeframe: number = 24
    ): Promise<IPositionMetrics> {
        this.initialize();

        try {
            const [
                rawPoolMetadata,
                feesEarned,
                utilization,
                healthScore,
                positionValue,
            ] = await Promise.all([
                this.lb.fetchPoolMetadata(poolAddress),
                this.calculateFeesEarned(position, currentPrice, timeframe),
                this.calculateUtilization(position, poolAddress),
                this.calculateHealthScore(position, poolAddress, currentPrice),
                this.calculatePositionValue(position, currentPrice),
            ]);

            if (!rawPoolMetadata) {
                throw new Error('Failed to fetch pool metadata');
            }

            const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;
            const binStep = poolMetadata.binStep || 0;
            const lowerPrice = this.calculateBinPrice(
                currentPrice,
                position.lowerBinId,
                poolMetadata.activeId || 0,
                binStep
            );
            const upperPrice = this.calculateBinPrice(
                currentPrice,
                position.upperBinId,
                poolMetadata.activeId || 0,
                binStep
            );

            // Calculate APR based on fees earned
            const apr = (feesEarned.total * (365 * 24 / timeframe) * 100) / positionValue;

            // Calculate impermanent loss
            const impermanentLoss = this.calculateImpermanentLoss(
                lowerPrice,
                currentPrice,
                positionValue
            );

            return {
                feesEarned: feesEarned.total,
                volume24h: feesEarned.total * 20, // Estimate volume from fees
                apr,
                impermanentLoss,
                priceRange: {
                    lower: lowerPrice,
                    upper: upperPrice,
                },
                utilization,
                healthScore,
            };
        } catch (error) {
            console.error('Failed to get position metrics:', error);
            throw error;
        }
    }
}