'use client';

import './globals.css';
import { WalletProvider } from '@/context/WalletContext';
import { PositionProvider } from '@/context/PositionContext';
import { WalletButton } from '@/components/common/WalletButton';
import { NetworkStatus } from '@/components/common/NetworkStatus';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <PositionProvider>
            <div className="min-h-screen bg-gray-50">
              <header className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h1 className="text-2xl font-serif font-bold text-gray-900">
                        Saros LP Manager
                      </h1>
                      <NetworkStatus />
                    </div>
                    <div className="flex items-center space-x-6">
                      <nav className="space-x-4">
                        <a
                          href="/dashboard"
                          className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                        >
                          Dashboard
                        </a>
                        <a
                          href="/positions"
                          className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                        >
                          Positions
                        </a>
                      </nav>
                      <WalletButton />
                    </div>
                  </div>
                </div>
              </header>

              <main className="flex-grow">
                {children}
              </main>

              <footer className="bg-white border-t border-gray-100 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <div className="text-center text-gray-500 text-sm">
                    <span className="font-mono">Saros LP Manager</span> •{' '}
                    <span className="italic">Built with ❤️ for DeFi</span>
                  </div>
                </div>
              </footer>
            </div>
          </PositionProvider>
        </WalletProvider>
      </body>
    </html>
  );
}