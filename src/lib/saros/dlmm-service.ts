import { Connection, PublicKey } from '@solana/web3.js';
import { LiquidityBookServices, MODE, Distribution, type PoolMetadata } from '@saros-finance/dlmm-sdk';
import { Transaction } from '@saros-finance/dlmm-sdk/node_modules/@solana/web3.js';
import { SOLANA_RPC_ENDPOINT, SAROS_PROGRAM_ID } from './config';

export interface CreatePositionParams {
  selectedPool: string;
  tokenA: string;
  tokenB: string;
  lowerBinId: number;
  upperBinId: number;
  amount: number;
  isTokenA: boolean;
  payer: string;
  signAndSendTransaction: (tx: Transaction) => Promise<string>;
}

export interface AdjustPositionParams {
  position: {
    positionMint?: string;
    address?: string;
    pair: string;
    tokenA?: string;
    tokenB?: string;
    lowerBinId?: number;
    upperBinId?: number;
  };
  newLowerBinId?: number;
  newUpperBinId?: number;
  addAmount?: number;
  removeAmount?: number;
  payer: string;
  signAndSendTransaction: (tx: Transaction) => Promise<string>;
}

export class SarosDLMMService {
  private lb: LiquidityBookServices;
  private programId: PublicKey;

  constructor(private connection: Connection) {
    if (!SAROS_PROGRAM_ID) {
      throw new Error('SAROS_PROGRAM_ID is not configured');
    }
    this.programId = new PublicKey(SAROS_PROGRAM_ID);
    
    this.lb = new LiquidityBookServices({
      mode: MODE.DEVNET,
      options: { 
        rpcUrl: SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com'
      },
    });
  }

  async createPosition(params: CreatePositionParams): Promise<{
    signature: string;
    positionMint: string;
    address: PublicKey;
  }> {
    try {
      const poolMetadata = await this.lb.fetchPoolMetadata(params.selectedPool) as PoolMetadata;
      if (!poolMetadata) {
        throw new Error('Could not fetch pool metadata');
      }

      const ACTIVE_ID = (poolMetadata as any).activeId || 0;
      const BIN_ARRAY_SIZE = 4096;
      const binArrayIndex = Math.floor(ACTIVE_ID / BIN_ARRAY_SIZE);

      if (params.lowerBinId >= params.upperBinId) {
        throw new Error('Lower bin ID must be less than upper bin ID');
      }

      const { Keypair } = await import('@solana/web3.js');
      const positionMint = Keypair.generate();
      const transaction = new Transaction();

      const relativeBinIdLeft = params.lowerBinId - ACTIVE_ID;
      const relativeBinIdRight = params.upperBinId - ACTIVE_ID;

      await this.lb.createPosition({
        payer: new PublicKey(params.payer),
        relativeBinIdLeft,
        relativeBinIdRight,
        pair: new PublicKey(params.selectedPool),
        binArrayIndex,
        positionMint: positionMint.publicKey,
        transaction,
      });

      if (!transaction.instructions?.length) {
        throw new Error('No instructions added to transaction by SDK');
      }

      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = new PublicKey(params.payer);

      transaction.partialSign(positionMint);

      const signature = await params.signAndSendTransaction(transaction);

      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      return {
        signature,
        positionMint: positionMint.publicKey.toString(),
        address: positionMint.publicKey,
      };
    } catch (error) {
      console.error('Failed to create position:', error);
      throw new Error(`Failed to create position: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async adjustPosition(params: AdjustPositionParams): Promise<{
    success: boolean;
    signatures: string[];
  }> {
    try {
      // Using Transaction from SDK
      const signatures: string[] = [];

      const poolMetadata = await this.lb.fetchPoolMetadata(params.position.pair) as PoolMetadata;
      if (!poolMetadata) {
        throw new Error('Could not fetch pool metadata');
      }

      const ACTIVE_ID = (poolMetadata as any).activeId || 0;
      const BIN_ARRAY_SIZE = 4096;

      if (params.addAmount && params.addAmount > 0) {
        const transaction = new Transaction();
        
        const lowerBinArrayIndex = Math.floor((params.position.lowerBinId || 0) / BIN_ARRAY_SIZE);
        const upperBinArrayIndex = Math.floor((params.position.upperBinId || 0) / BIN_ARRAY_SIZE);

        const distribution: Distribution[] = [];
        const binCount = (params.position.upperBinId || 0) - (params.position.lowerBinId || 0) + 1;
        const liquidityPerBin = params.addAmount / binCount;

        for (let i = params.position.lowerBinId || 0; i <= (params.position.upperBinId || 0); i++) {
          distribution.push({
            relativeBinId: i - ACTIVE_ID,
            distributionX: liquidityPerBin,
            distributionY: liquidityPerBin,
          });
        }

        await this.lb.addLiquidityIntoPosition({
          positionMint: new PublicKey(params.position.positionMint || params.position.address || ''),
          payer: new PublicKey(params.payer),
          pair: new PublicKey(params.position.pair),
          transaction,
          liquidityDistribution: distribution,
          amountY: params.addAmount,
          amountX: params.addAmount,
          binArrayLower: new PublicKey(lowerBinArrayIndex.toString()),
          binArrayUpper: new PublicKey(upperBinArrayIndex.toString()),
        });

        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.feePayer = new PublicKey(params.payer);

        const signature = await params.signAndSendTransaction(transaction);
        signatures.push(signature);

        const confirmation = await this.connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }
      }

      if (params.removeAmount && params.removeAmount > 0) {
        const result = await this.lb.removeMultipleLiquidity({
          maxPositionList: [{
            position: params.position.address || '',
            start: params.position.lowerBinId || 0,
            end: params.position.upperBinId || 0,
            positionMint: params.position.positionMint || params.position.address || '',
          }],
          payer: new PublicKey(params.payer),
          type: "removeBoth",
          pair: new PublicKey(params.position.pair),
          tokenMintX: new PublicKey(params.position.tokenA || ''),
          tokenMintY: new PublicKey(params.position.tokenB || ''),
          activeId: ACTIVE_ID,
        });

        if (result.txs?.length) {
          for (const tx of result.txs) {
            const signature = await params.signAndSendTransaction(tx);
            signatures.push(signature);

            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
            const confirmation = await this.connection.confirmTransaction({
              signature,
              blockhash,
              lastValidBlockHeight,
            });

            if (confirmation.value.err) {
              throw new Error(`Transaction failed: ${confirmation.value.err}`);
            }
          }
        }
      }

      return {
        success: signatures.length > 0,
        signatures,
      };
    } catch (error) {
      console.error('Failed to adjust position:', error);
      throw new Error(`Failed to adjust position: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPosition(positionId: string): Promise<any> {
    try {
      const positions = await this.lb.getUserPositions({
        payer: new PublicKey(positionId),
        pair: new PublicKey(positionId),
      });
      return positions[0] || null;
    } catch (error) {
      console.error('Failed to get position:', error);
      return null;
    }
  }

  async getPoolMetadata(poolId: string): Promise<any> {
    try {
      return await this.lb.fetchPoolMetadata(poolId);
    } catch (error) {
      console.error('Failed to fetch pool metadata:', error);
      return null;
    }
  }

  async getUserPositions(params: { payer: string; pair: string }): Promise<any[]> {
    try {
      const positions = await this.lb.getUserPositions({
        payer: new PublicKey(params.payer),
        pair: new PublicKey(params.pair),
      });
      return positions || [];
    } catch (error) {
      console.error('Failed to get user positions:', error);
      return [];
    }
  }

  async fetchPoolAddresses(): Promise<string[]> {
    try {
      const addresses = await this.lb.fetchPoolAddresses();
      return addresses || [];
    } catch (error) {
      console.error('Failed to fetch pool addresses:', error);
      return [];
    }
  }

  async getQuote(params: {
    pair: string;
    tokenBase: string;
    tokenQuote: string;
    amount: bigint;
    swapForY: boolean;
    isExactInput: boolean;
    tokenBaseDecimal: number;
    tokenQuoteDecimal: number;
    slippage: number;
  }): Promise<any> {
    try {
      return await this.lb.getQuote({
        pair: new PublicKey(params.pair),
        tokenBase: new PublicKey(params.tokenBase),
        tokenQuote: new PublicKey(params.tokenQuote),
        amount: params.amount,
        swapForY: params.swapForY,
        isExactInput: params.isExactInput,
        tokenBaseDecimal: params.tokenBaseDecimal,
        tokenQuoteDecimal: params.tokenQuoteDecimal,
        slippage: params.slippage,
      });
    } catch (error) {
      console.error('Failed to get quote:', error);
      throw error;
    }
  }

  async getPositionValue(position: any): Promise<{
    valueA: number;
    valueB: number;
    totalValue: number;
  }> {
    try {
      const poolMetadata = await this.lb.fetchPoolMetadata(position.pair);
      if (!poolMetadata) {
        return { valueA: 0, valueB: 0, totalValue: 0 };
      }

      // This is a simplified calculation - in a real implementation,
      // you would need to calculate the actual value based on bin liquidity
      const totalValue = position.liquidity || 0;
      return {
        valueA: totalValue / 2,
        valueB: totalValue / 2,
        totalValue,
      };
    } catch (error) {
      console.error('Failed to get position value:', error);
      return { valueA: 0, valueB: 0, totalValue: 0 };
    }
  }
}