import { Program, Provider, web3 } from '@project-serum/anchor';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { SAROS_PROGRAM_ID, DEFAULT_BIN_STEP } from './config';
import { IDLMMConfig, IDLMMPool, IDLMMPosition, IDLMMBin, IPositionMetrics } from './interfaces';
import { parsePool, parsePosition } from './parsers';

export class SarosDLMMService {
    private connection: Connection;
    private programId: PublicKey;

    constructor(connection: Connection) {
        this.connection = connection;
        this.dlmm = new SarosDLMM(connection, new PublicKey(SAROS_PROGRAM_ID!));
    }

    async getPool(tokenA: string, tokenB?: string): Promise<IDLMMPool | null> {
        try {
            let poolAddress: PublicKey;
            
            if (tokenB) {
                // Get pool by token pair
                [poolAddress] = await PublicKey.findProgramAddress(
                    [
                        Buffer.from('pool'),
                        new PublicKey(tokenA).toBuffer(),
                        new PublicKey(tokenB).toBuffer()
                    ],
                    this.programId
                );
            } else {
                // Get pool by pool address
                poolAddress = new PublicKey(tokenA);
            }

    async createPosition(
        pool: DLMMLiquidityPool,
        lowerBinId: number,
        upperBinId: number,
        amount: number,
        isTokenA: boolean
    ): Promise<string | null> {
        try {
            const tx = await pool.createPosition({
                lowerBinId,
                upperBinId,
                amount,
                isTokenA,
                binStep: DEFAULT_BIN_STEP
            });

            const signature = await tx.send();
            await tx.confirm();
            
            return signature;
        } catch (error) {
            console.error('Error creating position:', error);
            return null;
        }
    }

    async getPositionInfo(positionId: string): Promise<PositionInfo | null> {
        try {
            const position = await this.dlmm.getPosition(new PublicKey(positionId));
            return position.getInfo();
        } catch (error) {
            console.error('Error fetching position info:', error);
            return null;
        }
    }

    async adjustPosition(
        pool: DLMMLiquidityPool,
        positionId: string,
        newLowerBinId?: number,
        newUpperBinId?: number,
        addAmount?: number,
        removeAmount?: number
    ): Promise<boolean> {
        try {
            const position = await this.dlmm.getPosition(new PublicKey(positionId));
            
            if (addAmount) {
                const tx = await pool.addLiquidity({
                    position,
                    amount: addAmount,
                    isTokenA: true // TODO: Determine based on position
                });
                await tx.send();
                await tx.confirm();
            }

            if (removeAmount) {
                const tx = await pool.removeLiquidity({
                    position,
                    amount: removeAmount,
                    isTokenA: true // TODO: Determine based on position
                });
                await tx.send();
                await tx.confirm();
            }

            if (newLowerBinId || newUpperBinId) {
                // TODO: Implement range adjustment
                const currentInfo = await position.getInfo();
                // Need to remove liquidity from old range and add to new range
            }

            return true;
        } catch (error) {
            console.error('Error adjusting position:', error);
            return false;
        }
    }

    async calculatePositionMetrics(positionId: string): Promise<{
        impermanentLoss: number;
        fees: number;
        apy: number;
    } | null> {
        try {
            const position = await this.dlmm.getPosition(new PublicKey(positionId));
            const info = await position.getInfo();
            
            // TODO: Implement actual calculations using Saros SDK data
            return {
                impermanentLoss: 0,
                fees: 0,
                apy: 0
            };
        } catch (error) {
            console.error('Error calculating position metrics:', error);
            return null;
        }
    }
}