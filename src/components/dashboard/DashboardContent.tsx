'use client';

import { PositionProvider } from '@/context/PositionContext';
import { AnalyticsDashboard } from './AnalyticsDashboard';

export function DashboardContent() {
    return (
        <PositionProvider>
            <AnalyticsDashboard />
        </PositionProvider>
    );
}
