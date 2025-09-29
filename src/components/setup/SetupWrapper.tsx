'use client';

import { motion } from 'framer-motion';
import { TestTokenSetup } from './TestTokenSetup';
import { CreatePositionForm } from '../position/CreatePositionForm';
import { WalletButton } from '../common/WalletButton';
import { NetworkStatus } from '../common/NetworkStatus';

export function SetupWrapper() {
  return (
    <div className="py-12">
      {/* Client-only header components */}
      <div className="fixed top-4 right-4 z-40 flex items-center space-x-4">
        <div className="hidden sm:block">
          <NetworkStatus />
        </div>
        <WalletButton />
      </div>
      
      <motion.div 
        className="glass-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Rounded background container */}
        <div className="glass-container__background"></div>
        
        {/* Content */}
        <div className="glass-content">
          <div>
            <h1 className="text-3xl text-gray-800 mb-4" style={{ fontFamily: 'CustomFont', fontWeight: 900 }}>
              Setup & Testing
            </h1>
            <p className="mt-2 text-gray-800" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
              Create test tokens and positions on devnet for development.
            </p>
          </div>

          <div className="space-y-8">
            <TestTokenSetup />
            <CreatePositionForm
              onSuccess={() => {
                console.log('Position created successfully');
              }}
              onError={(error) => {
                console.error('Failed to create position:', error);
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
