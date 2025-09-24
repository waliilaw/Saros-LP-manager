'use client';

import { motion } from 'framer-motion';
import { PositionProvider } from '@/context/PositionContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        >
          <header className="bg-white bg-opacity-90 backdrop-blur-lg backdrop-filter border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-between"
              >
                <h1 className="text-2xl font-serif font-bold text-gray-900">
                  Saros LP Manager
                </h1>
                <nav className="space-x-4">
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="/dashboard"
                    className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  >
                    Dashboard
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="/positions"
                    className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  >
                    Positions
                  </motion.a>
                </nav>
              </motion.div>
            </div>
          </header>

          <main className="flex-grow">
            <PositionProvider>{children}</PositionProvider>
          </main>

          <footer className="bg-white bg-opacity-90 backdrop-blur-lg backdrop-filter border-t border-gray-100 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-center text-gray-500 text-sm">
                <span className="font-mono">Saros LP Manager</span> •{' '}
                <span className="italic">Built with ❤️ for DeFi</span>
              </div>
            </div>
          </footer>
        </motion.div>
      </body>
    </html>
  );
}