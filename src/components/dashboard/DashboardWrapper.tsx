'use client';

import { useEffect, useState } from 'react';
import { AnalyticsDashboard } from './AnalyticsDashboard';

export function DashboardWrapper() {
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

  return <AnalyticsDashboard />;
}