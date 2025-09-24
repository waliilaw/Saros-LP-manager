'use client';

import { SuggestionPanel } from '@/components/ai/SuggestionPanel';
import { PositionProvider } from '@/context/PositionContext';

export default function SuggestionsPage() {
  return (
    <PositionProvider>
      <SuggestionPanel />
    </PositionProvider>
  );
}
