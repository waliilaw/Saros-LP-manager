import { AnchorProvider as Provider } from "@project-serum/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { SAROS_PROGRAM_ID } from "./config";
import { IDLMMConfig, IDLMMPool, IDLMMPosition, IPositionMetrics } from "./interfaces";
import { parsePool, parsePosition } from "./parsers";

export class SarosDLMMService {
    private connection: Connection;
    private programId: PublicKey;
    private provider!: Provider;

    constructor(connection: Connection, provider: Provider) {
        if (!provider.sendAndConfirm) {
            throw new Error('Provider must be an AnchorProvider');
        }
        this.connection = connection;
        this.provider = provider;
        this.programId = new PublicKey(SAROS_PROGRAM_ID as string);
    }

    async createPosition(
        pool: IDLMMPool,
        lowerBinId: number,
        upperBinId: number,
        amount: bigint,
        isTokenX: boolean
    ): Promise<string> {
        try {
            const tx = new Transaction();
            // Add position creation instruction
            // Note: This is a placeholder. Actual instruction creation would use the Saros SDK
            
            const signature = await this.provider.sendAndConfirm(tx);
            return signature;
        } catch (error) {
            console.error('Error creating position:', error);
            throw error;
        }
    }

    async getPosition(address: PublicKey): Promise<IDLMMPosition> {
        try {
            const accountInfo = await this.connection.getAccountInfo(address);
            if (!accountInfo) {
                throw new Error('Position not found');
            }

            return parsePosition(accountInfo.data, address);
        } catch (error) {
            console.error('Error fetching position:', error);
            throw error;
        }
    }

    async getPool(address: PublicKey): Promise<IDLMMPool> {
        try {
            const accountInfo = await this.connection.getAccountInfo(address);
            if (!accountInfo) {
                throw new Error('Pool not found');
            }

            return parsePool(accountInfo.data, address);
        } catch (error) {
            console.error('Error fetching pool:', error);
            throw error;
        }
    }

    async addLiquidity(
        position: IDLMMPosition,
        amount: bigint,
        isTokenX: boolean
    ): Promise<string> {
        try {
            const tx = new Transaction();
            // Add liquidity addition instruction
            // Note: This is a placeholder. Actual instruction creation would use the Saros SDK
            
            const signature = await this.provider.sendAndConfirm(tx);
            return signature;
        } catch (error) {
            console.error('Error adding liquidity:', error);
            throw error;
        }
    }

    async removeLiquidity(
        position: IDLMMPosition,
        amount: bigint,
        isTokenX: boolean
    ): Promise<string> {
        try {
            const tx = new Transaction();
            // Add liquidity removal instruction
            // Note: This is a placeholder. Actual instruction creation would use the Saros SDK
            
            const signature = await this.provider.sendAndConfirm(tx);
            return signature;
        } catch (error) {
            console.error('Error removing liquidity:', error);
            throw error;
        }
    }

    async adjustPositionRange(
        position: IDLMMPosition,
        newLowerBinId: number,
        newUpperBinId: number
    ): Promise<string> {
        try {
            const tx = new Transaction();
            // Add range adjustment instruction
            // Note: This is a placeholder. Actual instruction creation would use the Saros SDK
            
            const signature = await this.provider.sendAndConfirm(tx);
            return signature;
        } catch (error) {
            console.error('Error adjusting position range:', error);
            throw error;
        }
    }

    async getPositionMetrics(position: IDLMMPosition): Promise<IPositionMetrics> {
        try {
            const pool = await this.getPool(position.pool);
            
            const tvl = this.calculateTVL(position);
            const apr = await this.calculateAPR(position, pool);
            const priceRange = this.calculatePriceRange(position, pool);
            const binUtilization = this.calculateBinUtilization(position);
            const { volumeLast24h, feesLast24h } = await this.getVolumeAndFees(pool);
            const impermanentLoss = this.calculateImpermanentLoss(position, pool);

            return {
                totalValueLocked: tvl,
                apr,
                priceRange,
                impermanentLoss,
                volumeLast24h,
                feesLast24h,
                binUtilization
            };
        } catch (error) {
            console.error('Error calculating position metrics:', error);
            throw error;
        }
    }

    private calculateTVL(position: IDLMMPosition): number {
        return Number(position.tokenXDeposited) + Number(position.tokenYDeposited);
    }

    private async calculateAPR(position: IDLMMPosition, pool: IDLMMPool): Promise<number> {
        const fees24h = Number(position.feesEarnedX) + Number(position.feesEarnedY);
        const tvl = this.calculateTVL(position);
        return (fees24h * 365 * 100) / tvl;
    }

    private calculatePriceRange(position: IDLMMPosition, pool: IDLMMPool) {
        const currentPrice = pool.reserveX ? Number(pool.reserveY) / Number(pool.reserveX) : 0;
        return {
            min: Math.max(0, currentPrice * 0.8), // 20% below current
            current: currentPrice,
            max: currentPrice * 1.2 // 20% above current
        };
    }

    private calculateBinUtilization(position: IDLMMPosition): number {
        const binRange = position.upperBinId - position.lowerBinId;
        const activeBins = position.liquidityShares.filter(share => share > BigInt(0)).length;
        return (activeBins / binRange) * 100;
    }

    private async getVolumeAndFees(pool: IDLMMPool) {
        // Note: This is a placeholder. Actual implementation would fetch historical data
        return {
            volumeLast24h: Number(pool.reserveX) + Number(pool.reserveY),
            feesLast24h: Number(pool.feesX) + Number(pool.feesY)
        };
    }

    private calculateImpermanentLoss(position: IDLMMPosition, pool: IDLMMPool): number {
        const currentPrice = pool.reserveX ? Number(pool.reserveY) / Number(pool.reserveX) : 0;
        const initialPrice = position.tokenYDeposited ? 
            Number(position.tokenYDeposited) / Number(position.tokenXDeposited) : 
            currentPrice;
        
        if (currentPrice === 0 || initialPrice === 0) return 0;
        
        const priceRatio = currentPrice / initialPrice;
        const il = 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
        return Math.abs(il * 100);
    }
}
