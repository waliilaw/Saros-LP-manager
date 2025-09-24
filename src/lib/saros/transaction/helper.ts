import { Connection, Transaction, PublicKey, sendAndConfirmTransaction } from '@solana/web3.js';
import { WalletAdapter } from '@/lib/wallet/adapter';

export interface TransactionOptions {
  commitment?: 'processed' | 'confirmed' | 'finalized';
  maxRetries?: number;
  skipPreflight?: boolean;
}

export class TransactionHelper {
  constructor(
    private connection: Connection,
    private wallet: WalletAdapter
  ) {}

  async sendAndConfirm(
    transaction: Transaction,
    options: TransactionOptions = {}
  ): Promise<string> {
    const {
      commitment = 'confirmed',
      maxRetries = 3,
      skipPreflight = false,
    } = options;

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = 
          await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.wallet.publicKey!;

        // Sign transaction
        const signedTx = await this.wallet.signTransaction(transaction);

        // Send transaction
        const signature = await this.connection.sendRawTransaction(
          signedTx.serialize(),
          {
            skipPreflight,
            maxRetries: 3,
          }
        );

        // Confirm transaction
        const confirmation = await this.connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        }, commitment);

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        return signature;
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        console.warn(`Transaction attempt ${attempt} failed:`, error);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error('Transaction failed after max retries');
  }

  async simulateTransaction(
    transaction: Transaction
  ): Promise<any> {
    try {
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey!;

      // Sign transaction
      const signedTx = await this.wallet.signTransaction(transaction);

      // Simulate transaction
      const simulation = await this.connection.simulateTransaction(signedTx);

      return simulation;
    } catch (error) {
      console.error('Transaction simulation failed:', error);
      throw error;
    }
  }

  async estimateFees(
    transaction: Transaction
  ): Promise<number> {
    try {
      const simulation = await this.simulateTransaction(transaction);
      return simulation.value.feeCalculator.lamportsPerSignature;
    } catch (error) {
      console.error('Fee estimation failed:', error);
      throw error;
    }
  }

  async hasEnoughSol(
    address: PublicKey,
    amount: number
  ): Promise<boolean> {
    try {
      const balance = await this.connection.getBalance(address);
      return balance >= amount;
    } catch (error) {
      console.error('Balance check failed:', error);
      throw error;
    }
  }

  async waitForConfirmation(
    signature: string,
    commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed'
  ): Promise<void> {
    try {
      await this.connection.confirmTransaction(signature, commitment);
    } catch (error) {
      console.error('Transaction confirmation failed:', error);
      throw error;
    }
  }
}
