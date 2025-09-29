'use client';

import { DashboardContent } from './DashboardContent';
import { WalletButton } from '../common/WalletButton';
import { NetworkStatus } from '../common/NetworkStatus';

export function DashboardWrapper() {
    return (
        <div className="py-8">
            {/* Client-only header components */}
            <div className="fixed top-4 right-4 z-40 flex items-center space-x-4">
                <div className="hidden sm:block">
                    <NetworkStatus />
                </div>
                <WalletButton />
            </div>
            
            <div className="glass-container">
                {/* Rounded background container */}
                <div className="glass-container__background"></div>
                
                {/* Content */}
                <div className="relative z-10 p-8">
                    <DashboardContent />
                </div>
            </div>
        </div>
    );
}
