import { createContext, useContext, ReactNode } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

interface WalletContextState {
  wallet: any;
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  connection: Connection | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (transaction: Transaction) => Promise<string>;
}

const SSRSafeWalletContext = createContext<WalletContextState>({
  wallet: null,
  publicKey: null,
  connected: false,
  connecting: false,
  connection: null,
  connect: async () => { throw new Error('Wallet not available during SSR'); },
  disconnect: async () => { throw new Error('Wallet not available during SSR'); },
  signAndSendTransaction: async () => { throw new Error('Wallet not available during SSR'); },
});

export function SSRSafeWalletProvider({ children }: { children: ReactNode }) {
  return (
    <SSRSafeWalletContext.Provider value={{
      wallet: null,
      publicKey: null,
      connected: false,
      connecting: false,
      connection: null,
      connect: async () => { throw new Error('Wallet not available during SSR'); },
      disconnect: async () => { throw new Error('Wallet not available during SSR'); },
      signAndSendTransaction: async () => { throw new Error('Wallet not available during SSR'); },
    }}>
      {children}
    </SSRSafeWalletContext.Provider>
  );
}

export function useSSRSafeWallet() {
  const context = useContext(SSRSafeWalletContext);
  if (!context) {
    throw new Error('useSSRSafeWallet must be used within a SSRSafeWalletProvider');
  }
  return context;
}