'use client';

import { useState, useEffect } from 'react';
import { CreatePositionForm } from './CreatePositionForm';

export function CreatePositionWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="p-6 border border-gray-700/100 rounded-xl">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return <CreatePositionForm />;
}
