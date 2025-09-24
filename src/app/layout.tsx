'use client';

import './globals.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/fira-code/400.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-serif font-bold text-gray-900">
                  Saros LP Manager
                </h1>
                <nav className="space-x-6">
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
      </body>
    </html>
  );
}
