'use client';

import { ReactNode, useEffect, useState } from 'react';
import { SSRSafeWalletProvider } from '@/context/SSRSafeWalletContext';

// Lazy load the real providers
const LazyWalletProvider = () => import('@/context/WalletContext').then(m => m.WalletProvider);
const LazyPositionProvider = () => import('@/context/PositionContext').then(m => m.PositionProvider);

export function ClientProviders({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [WalletProvider, setWalletProvider] = useState<any>(null);
  const [PositionProvider, setPositionProvider] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import the real providers
    LazyWalletProvider().then(setWalletProvider);
    LazyPositionProvider().then(setPositionProvider);
  }, []);

  if (typeof window === 'undefined') {
    return <SSRSafeWalletProvider>{children}</SSRSafeWalletProvider>;
  }

  if (!isClient || !WalletProvider || !PositionProvider) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <WalletProvider>
      <PositionProvider>
        {children}
      </PositionProvider>
    </WalletProvider>
  );
}