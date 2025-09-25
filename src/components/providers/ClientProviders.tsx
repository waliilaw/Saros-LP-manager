'use client';

import { WalletProvider } from '@/context/WalletContext';
import { PositionProvider } from '@/context/PositionContext';
import { ReactNode } from 'react';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <PositionProvider>
        {children}
      </PositionProvider>
    </WalletProvider>
  );
}