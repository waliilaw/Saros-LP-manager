'use client';

import { motion } from 'framer-motion';
import { TestTokenSetup } from '@/components/setup/TestTokenSetup';
import { CreatePositionForm } from '@/components/position/CreatePositionForm';
import { useEffect, useState } from 'react';

export function SetupWrapper() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <div className="min-h-screen flex items-center justify-center">Loading Setup...</div>;
    }

    return (
        <div className="py-16 px-4 max-w-7xl mx-auto">
            <div className="glass-container">
                <div className="glass-container__background"></div>
                <div className="relative z-10 p-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-16"
                    >
                        <h1 className="text-5xl text-gray-800 mb-6" style={{ fontFamily: 'CustomFont', fontWeight: 900 }}>
                            Setup & Testing
                        </h1>
                        <p className="text-xl text-gray-700 max-w-4xl leading-relaxed" style={{ fontFamily: 'CustomFont', fontWeight: 400 }}>
                            Create test tokens and positions on devnet for development.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                        {/* Test Token Setup - Takes 1 column */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="xl:col-span-1"
                        >
                            <TestTokenSetup />
                        </motion.div>

                        {/* Create Position Form - Takes 2 columns */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="xl:col-span-2"
                        >
                            <CreatePositionForm
                                onSuccess={() => {
                                    console.log('Position created successfully');
                                }}
                                onError={(error) => {
                                    console.error('Failed to create position:', error);
                                }}
                            />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}