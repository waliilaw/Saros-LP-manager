'use client';

import { motion } from 'framer-motion';
import { TestTokenSetup } from '@/components/setup/TestTokenSetup';
import { CreatePositionForm } from '@/components/position/CreatePositionForm';
import { NetworkStatus } from '@/components/common/NetworkStatus';

export default function SetupPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            Setup & Testing
          </h1>
          <p className="mt-2 text-gray-600">
            Create test tokens and positions on devnet for development.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <NetworkStatus />
          <span className="text-sm text-gray-500">
            Make sure you&apos;re connected to devnet
          </span>
        </div>

        <div className="space-y-8">
          <TestTokenSetup />
          <CreatePositionForm
            onSuccess={() => {
              // You could add a success notification here
              console.log('Position created successfully');
            }}
            onError={(error) => {
              // You could add an error notification here
              console.error('Failed to create position:', error);
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
