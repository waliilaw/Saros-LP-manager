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

    // Add automatic refresh on mount and when page gains focus
    useEffect(() => {
        if (isClient) {
            refreshPositions();
            
            // Refresh every 30 seconds
            const interval = setInterval(refreshPositions, 30000);
            
            // Refresh when window gains focus (e.g., when user navigates back to dashboard)
            const handleFocus = () => {
                console.log('Dashboard gained focus, refreshing positions...');
                refreshPositions();
            };
            window.addEventListener('focus', handleFocus);
            
            return () => {
                clearInterval(interval);
                window.removeEventListener('focus', handleFocus);
            };
        }
    }, [isClient, refreshPositions]);

    if (!isClient) {
        return <div className="min-h-screen flex items-center justify-center">Loading Dashboard...</div>;
    }

    return (
        <div className="py-8">
            <div className="glass-container">
                <div className="glass-container__background"></div>
                <div className="relative z-10 p-8 ">
                    <DashboardContent />
                </div>
            </div>
        </div>
    );
}