'use client';

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { useEffect, useState } from 'react';
import { usePositions } from '@/context/PositionContext';

export function DashboardWrapper() {
    const [isClient, setIsClient] = useState(false);
    const { refreshPositions } = usePositions();

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Add automatic refresh on mount
    useEffect(() => {
        if (isClient) {
            refreshPositions();
            // Refresh every 30 seconds
            const interval = setInterval(refreshPositions, 30000);
            return () => clearInterval(interval);
        }
    }, [isClient, refreshPositions]);

    if (!isClient) {
        return <div className="min-h-screen flex items-center justify-center">Loading Dashboard...</div>;
    }

    return (
        <div className="py-8">
            <div className="glass-container">
                <div className="glass-container__background"></div>
                <div className="relative z-10 p-8">
                    <DashboardContent />
                </div>
            </div>
        </div>
    );
}