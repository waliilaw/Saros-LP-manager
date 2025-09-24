'use client';

import { ComparisonPanel } from '@/components/comparison/ComparisonPanel';
import { PositionProvider } from '@/context/PositionContext';

export default function ComparisonPage() {
  return (
    <PositionProvider>
      <ComparisonPanel />
    </PositionProvider>
  );
}
