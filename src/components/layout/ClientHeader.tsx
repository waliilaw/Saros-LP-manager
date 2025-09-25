'use client';

import { WalletButton } from '@/components/common/WalletButton';
import { NetworkStatus } from '@/components/common/NetworkStatus';

export function ClientHeader() {
  return (
    <header className="fixed top-4 left-0 w-full z-30 px-4">
      <div className="relative max-w-7xl mx-auto">
        {/* Rounded background container */}
        <div className="header__background"></div>
        
        {/* Header content */}
        <div className="relative z-10 px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl text-gray-800 tracking-tight" style={{ fontFamily: 'CustomFont', fontWeight: 900 }}>
                Saros
              </h1>
              <span className="text-gray-800 text-sm" style={{ fontFamily: 'CustomFont', fontWeight: 200 }}>LP Manager</span>
              <div className="ml-4">
                <NetworkStatus />
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <nav className="hidden md:flex items-center space-x-8">
                <a href="/dashboard" className="nav-link">
                  Dashboard
                </a>
                <a href="/positions" className="nav-link">
                  Positions
                </a>
                <a href="/setup" className="nav-link">
                  Setup
                </a>
              </nav>
              <WalletButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}