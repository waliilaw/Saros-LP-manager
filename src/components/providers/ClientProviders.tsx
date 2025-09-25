'use client';

import { WalletProvider } from '@/context/WalletContext';
import { PositionProvider } from '@/context/PositionContext';
import { ReactNode, useEffect, useState } from 'react';

export function ClientProviders({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Return a loading state or minimal version for SSR
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <WalletProvider>
      <PositionProvider>
        {children}
      </PositionProvider>
    </WalletProvider>
  );
}