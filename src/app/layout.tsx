
import './globals.css';
import { ClientProviders } from '@/components/providers/ClientProviders';
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
        <ClientProviders>
          {/* Background Video - Vimeo Embed */}
          <div className="video-container">
            <iframe
              src="https://player.vimeo.com/video/1040597353?autoplay=1&loop=1&muted=1&background=1&controls=0&title=0&byline=0&portrait=0"
              className="vimeo-background"
              frameBorder="0"
              allow="autoplay; fullscreen"
            />
          </div>
          
          <div className="relative z-20 min-h-screen">
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
                        <a href="/analytics" className="nav-link">
                          Analytics
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
            
            {/* Add top padding to content to account for fixed header */}
            <div className="pt-20"></div>

            <main className="flex-grow mb-16">
              {children}
            </main>

            <footer className="mb-4 px-4">
              <div className="relative max-w-7xl mx-auto">
                {/* Rounded background container */}
                <div className="footer__background"></div>
                
                {/* Footer content */}
                <div className="relative z-10 px-6 lg:px-8 py-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    
                    {/* Saros Brand */}
                    <div className="col-span-1 md:col-span-1">
                      <h3 className="text-lg text-gray-800 mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 900 }}>Saros Finance</h3>
                      <p className="text-gray-800 text-sm mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
                        Advanced liquidity management tools for DeFi markets on Solana.
                      </p>
                      <div className="flex space-x-3">
                        <a href="https://twitter.com/SarosFinance" className="footer-link hover:text-blue-600" target="_blank" rel="noopener noreferrer">
                          Twitter
                        </a>
                        <a href="https://discord.gg/saros" className="footer-link hover:text-purple-600" target="_blank" rel="noopener noreferrer">
                          Discord
                        </a>
                        <a href="https://github.com/saros-finance" className="footer-link hover:text-gray-800" target="_blank" rel="noopener noreferrer">
                          GitHub
                        </a>
                      </div>
                    </div>

                    {/* Products */}
                    <div>
                      <h4 className="text-sm text-gray-800 uppercase tracking-wide mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>Products</h4>
                      <ul className="space-y-3">
                        <li><a href="/dashboard" className="footer-link">LP Manager</a></li>
                        <li><a href="https://app.saros.finance" className="footer-link" target="_blank" rel="noopener noreferrer">Saros App</a></li>
                        <li><a href="https://docs.saros.finance" className="footer-link" target="_blank" rel="noopener noreferrer">DLMM Protocol</a></li>
                        <li><a href="/analytics" className="footer-link">Analytics</a></li>
                      </ul>
                    </div>

                    {/* Resources */}
                    <div>
                      <h4 className="text-sm text-gray-800 uppercase tracking-wide mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>Resources</h4>
                      <ul className="space-y-3">
                        <li><a href="https://docs.saros.finance" className="footer-link" target="_blank" rel="noopener noreferrer">Documentation</a></li>
                        <li><a href="https://github.com/saros-finance/dlmm-sdk" className="footer-link" target="_blank" rel="noopener noreferrer">SDK</a></li>
                        <li><a href="https://saros.finance/blog" className="footer-link" target="_blank" rel="noopener noreferrer">Blog</a></li>
                        <li><a href="/setup" className="footer-link">API Guide</a></li>
                      </ul>
                    </div>

                    {/* Community */}
                    <div>
                      <h4 className="text-sm text-gray-800 uppercase tracking-wide mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>Community</h4>
                      <ul className="space-y-3">
                        <li><a href="https://solana.com" className="footer-link" target="_blank" rel="noopener noreferrer">Solana</a></li>
                        <li><a href="https://phantom.app" className="footer-link" target="_blank" rel="noopener noreferrer">Phantom Wallet</a></li>
                        <li><a href="https://www.coingecko.com/en/coins/saros" className="footer-link" target="_blank" rel="noopener noreferrer">CoinGecko</a></li>
                        <li><a href="https://coinmarketcap.com/currencies/saros/" className="footer-link" target="_blank" rel="noopener noreferrer">CoinMarketCap</a></li>
                      </ul>
                    </div>

                  </div>

                  {/* Bottom bar */}
                  <div className="border-t border-gray-300/30 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
                    <div className="text-gray-800 text-sm" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
                      <span style={{ fontFamily: 'CustomFont', fontWeight: 700 }}>Saros LP Manager</span> • Built with ❤️ by Wali
                    </div>
                    <div className="text-gray-800 text-sm mt-4 md:mt-0" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
                      © 2025 Saros . All rights reserved.
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}