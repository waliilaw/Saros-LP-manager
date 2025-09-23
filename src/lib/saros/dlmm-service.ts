import { AnchorProvider as Provider } from "@project-serum/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { SAROS_PROGRAM_ID } from "./config";
import { IDLMMPool, IDLMMPosition, IPositionMetrics } from "./interfaces";
import { parsePool, parsePosition } from "./parsers";

export class SarosDLMMService {
    private connection: Connection;
    private programId: PublicKey;
    private provider!: Provider;

    constructor(connection: Connection, provider?: Provider) {
        this.connection = connection;
        if (provider) {
            if (!provider.sendAndConfirm) {
                throw new Error('Provider must be an AnchorProvider');
            }
            this.provider = provider;
        }
        this.programId = new PublicKey(SAROS_PROGRAM_ID as string);
    }

    async createPosition(params: {
        tokenA: string;
        tokenB: string;
        lowerBinId: number;
        upperBinId: number;
        amount: number;
        isTokenA: boolean;
    }): Promise<IDLMMPosition> {
        try {
            const tx = new Transaction();
            // TODO: Implement position creation with Saros SDK
            // Construct instruction data
            // For demo purposes, return a mock position
            return {
                address: new PublicKey('11111111111111111111111111111111111111111111111111'),
                owner: new PublicKey('11111111111111111111111111111111111111111111111111'),
                pool: new PublicKey('11111111111111111111111111111111111111111111111111'),
                tokenXDeposited: BigInt(params.amount),
                tokenYDeposited: BigInt(0),
                feesEarnedX: BigInt(0),
                feesEarnedY: BigInt(0),
                lastUpdatedAt: Date.now(),
                lowerBinId: params.lowerBinId,
                upperBinId: params.upperBinId,
                liquidityShares: [BigInt(1000)],
                healthFactor: 100
            };
        } catch (error) {
            console.error('Error creating position:', error);
            throw error;
        }
    }

    async getUserPositions(): Promise<IDLMMPosition[]> {
        // For demo purposes, return some mock positions
            return [
                {
                    address: new PublicKey('11111111111111111111111111111111111111111111111111'),
                    owner: new PublicKey('11111111111111111111111111111111111111111111111111'),
                    pool: new PublicKey('11111111111111111111111111111111111111111111111111'),
                tokenXDeposited: BigInt(1000000),
                tokenYDeposited: BigInt(1000000),
                feesEarnedX: BigInt(5000),
                feesEarnedY: BigInt(5000),
                lastUpdatedAt: Date.now(),
                lowerBinId: 1000,
                upperBinId: 2000,
                liquidityShares: [BigInt(1000)],
                healthFactor: 100
            }
        ];
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
            // TODO: Implement liquidity addition with Saros SDK
            // Construct instruction data
            const data = {
                position: position.address,
                amount,
                isTokenX,
                pool: position.pool
            };
            console.log('Adding liquidity with data:', data);
            
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
            // TODO: Implement liquidity removal with Saros SDK
            // Construct instruction data
            const data = {
                position: position.address,
                amount,
                isTokenX,
                pool: position.pool
            };
            console.log('Removing liquidity with data:', data);
            
            const signature = await this.provider.sendAndConfirm(tx);
            return signature;
        } catch (error) {
            console.error('Error removing liquidity:', error);
            throw error;
        }
    }

    async adjustPosition(params: {
        position: IDLMMPosition;
        newLowerBinId?: number;
        newUpperBinId?: number;
        addAmount?: number;
        removeAmount?: number;
    }): Promise<boolean> {
        try {
            const tx = new Transaction();
            // TODO: Implement range adjustment with Saros SDK
            // Construct instruction data
            // For demo purposes, always return success
            return true;
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

    private calculatePriceRange(_position: IDLMMPosition, pool: IDLMMPool) {
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
