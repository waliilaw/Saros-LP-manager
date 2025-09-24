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
  wallet: PhantomWalletAdapter;
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  connection: Connection;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet] = useState(() => new PhantomWalletAdapter());
  const [connecting, setConnecting] = useState(false);
  const [connection] = useState(
    () => new Connection(SOLANA_RPC_ENDPOINT || `https://api.${SOLANA_NETWORK}.solana.com`)
  );

  const connect = useCallback(async () => {
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
    try {
      await wallet.disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }, [wallet]);

  // Auto-connect if previously connected
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
