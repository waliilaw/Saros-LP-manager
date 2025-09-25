'use client';

import { DashboardContent } from '@/components/dashboard/DashboardContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardPage() {
    return (
        <div className="py-8">
            <div className="glass-container">
                {/* Rounded background container */}
                <div className="glass-container__background"></div>
                
                {/* Content */}
                <div className="glass-content">
                    <DashboardContent />
                </div>
            </div>
        </div>
    );
}