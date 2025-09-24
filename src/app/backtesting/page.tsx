'use client';

import { BacktestPanel } from '@/components/backtesting/BacktestPanel';
import { PositionProvider } from '@/context/PositionContext';

export default function BacktestingPage() {
  return (
    <PositionProvider>
      <BacktestPanel />
    </PositionProvider>
  );
}
