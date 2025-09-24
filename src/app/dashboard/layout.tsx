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
       

          <main className="flex-grow">
            <PositionProvider>{children}</PositionProvider>
          </main>
</body>
    </html>
  );
}