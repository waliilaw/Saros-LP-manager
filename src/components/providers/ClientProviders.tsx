'use client';

import { ReactNode, useEffect, useState } from 'react';
import { WalletProvider } from '@/context/WalletContext';
import { PositionProvider } from '@/context/PositionContext';

export function ClientProviders({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <WalletProvider>
      <PositionProvider>
        {children}
      </PositionProvider>
    </WalletProvider>
  );
}