'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@/lib/wallet/adapter';
import { SOLANA_NETWORK, SOLANA_RPC_ENDPOINT } from '@/lib/saros/config';

interface WalletContextType {
  wallet: PhantomWalletAdapter | null;
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  connection: Connection | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (transaction: any) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<PhantomWalletAdapter | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  
  // Initialize wallet and connection on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const walletAdapter = new PhantomWalletAdapter();
      const rpcConnection = new Connection(SOLANA_RPC_ENDPOINT);
      setWallet(walletAdapter);
      setConnection(rpcConnection);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!wallet) {
      console.error('Wallet not initialized');
      return;
    }
    try {
      setConnecting(true);
      await wallet.connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, [wallet]);

  const disconnect = useCallback(async () => {
    if (!wallet) {
      console.error('Wallet not initialized');
      return;
    }
    try {
      await wallet.disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }, [wallet]);

  const signAndSendTransaction = useCallback(async (transaction: any) => {
    if (!connection) {
      throw new Error('Connection not available');
    }
    if (!wallet) {
      throw new Error('Wallet not initialized');
    }
    return await wallet.signAndSendTransaction(connection, transaction);
  }, [wallet, connection]);

  // Auto-connect if previously connected
  useEffect(() => {
    if (typeof window !== 'undefined' && wallet) {
      const autoConnect = async () => {
        try {
          if ((window as any).solana?.isPhantom && !wallet.connected) {
            await connect();
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      };

      autoConnect();
    }
  }, [wallet, connect]);

  // Don't render until wallet is initialized on client side
  if (typeof window === 'undefined' || !wallet || !connection) {
    return (
      <WalletContext.Provider
        value={{
          wallet: null as any,
          publicKey: null,
          connected: false,
          connecting: false,
          connection: null as any,
          connect: async () => {},
          disconnect: async () => {},
          signAndSendTransaction: async () => { throw new Error('Wallet not ready'); },
        }}
      >
        {children}
      </WalletContext.Provider>
    );
  }

  return (
    <WalletContext.Provider
      value={{
        wallet,
        publicKey: wallet.publicKey,
        connected: wallet.connected,
        connecting,
        connection,
        connect,
        disconnect,
        signAndSendTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
