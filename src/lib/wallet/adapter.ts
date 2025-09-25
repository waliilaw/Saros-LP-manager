import { PublicKey, Transaction } from '@solana/web3.js';

export interface WalletAdapter {
  publicKey: PublicKey | null;
  connected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}

export class PhantomWalletAdapter implements WalletAdapter {
  private _publicKey: PublicKey | null = null;
  private _connected: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for Phantom wallet
      window.addEventListener('load', () => {
        (window as any).solana?.on('connect', () => {
          this._connected = true;
          this._publicKey = (window as any).solana?.publicKey || null;
        });

        (window as any).solana?.on('disconnect', () => {
          this._connected = false;
          this._publicKey = null;
        });
      });
    }
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get connected(): boolean {
    return this._connected;
  }

  async connect(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Window is not defined');
      }

      const solana = (window as any).solana;

      if (!solana) {
        window.open('https://phantom.app/', '_blank');
        throw new Error('Phantom wallet not found');
      }

      if (solana.isPhantom) {
        await solana.connect();
        this._publicKey = solana.publicKey;
        this._connected = true;
      }
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      const solana = (window as any).solana;
      if (solana && solana.isPhantom) {
        await solana.disconnect();
        this._publicKey = null;
        this._connected = false;
      }
    } catch (error) {
      console.error('Error disconnecting from Phantom wallet:', error);
      throw error;
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const solana = (window as any).solana;
      if (!solana || !solana.isPhantom) {
        throw new Error('Phantom wallet not found');
      }

      if (!this._connected) {
        throw new Error('Wallet not connected');
      }

      return await solana.signTransaction(transaction);
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  }

  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    try {
      const solana = (window as any).solana;
      if (!solana || !solana.isPhantom) {
        throw new Error('Phantom wallet not found');
      }

      if (!this._connected) {
        throw new Error('Wallet not connected');
      }

      return await solana.signAllTransactions(transactions);
    } catch (error) {
      console.error('Error signing transactions:', error);
      throw error;
    }
  }

  async signAndSendTransaction(connection: any, transaction: Transaction): Promise<string> {
    try {
      const signedTx = await this.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      console.error('Error signing and sending transaction:', error);
      throw error;
    }
  }
}
