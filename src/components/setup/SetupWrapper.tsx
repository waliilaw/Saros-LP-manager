'use client';

import { useEffect, useState } from 'react';
import { TestTokenSetup } from './TestTokenSetup';
import { CreatePositionForm } from '../position/CreatePositionForm';

export function SetupWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <TestTokenSetup />
      <CreatePositionForm
        onSuccess={() => {
          console.log('Position created successfully');
        }}
        onError={(error) => {
          console.error('Failed to create position:', error);
        }}
      />
    </div>
  );
}