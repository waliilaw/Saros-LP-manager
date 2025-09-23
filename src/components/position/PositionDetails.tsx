'use client';

import { usePositions } from '@/context/PositionContext';
import { formatNumber } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { LoadingState } from '../common/LoadingStates';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { AdjustPositionModal } from './AdjustPositionModal';
import { AutomationControls } from './AutomationControls';

interface PositionDetailsProps {
    positionId: string;
    onClose: () => void;
}

export function PositionDetails({ positionId, onClose }: PositionDetailsProps) {
    const { positions, positionMetrics } = usePositions();
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [showAutomation, setShowAutomation] = useState(false);

    const position = useMemo(() => 
        positions.find(p => p.address.toString() === positionId),
        [positions, positionId]
    );

    const metrics = useMemo(() => 
        position ? positionMetrics.get(positionId) : null,
        [position, positionMetrics, positionId]
    );

    if (!position || !metrics) {
        return <div>Loading...</div>;
    }

    return (
        <ErrorBoundary>
            <LoadingState isLoading={!position || !metrics}>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Position Details</h2>
                        <button 
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <h3 className="text-sm text-gray-500">Total Value Locked</h3>
                            <p className="text-lg font-semibold">
                                ${formatNumber(metrics.totalValueLocked)}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm text-gray-500">APR</h3>
                            <p className="text-lg font-semibold">
                                {formatNumber(metrics.apr)}%
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm text-gray-500">24h Volume</h3>
                            <p className="text-lg font-semibold">
                                ${formatNumber(metrics.volumeLast24h)}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm text-gray-500">24h Fees</h3>
                            <p className="text-lg font-semibold">
                                ${formatNumber(metrics.feesLast24h)}
                            </p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Price Range</h3>
                        <div className="bg-gray-100 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500">Min</p>
                                    <p className="font-medium">${formatNumber(metrics.priceRange.min)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Current</p>
                                    <p className="font-medium">${formatNumber(metrics.priceRange.current)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Max</p>
                                    <p className="font-medium">${formatNumber(metrics.priceRange.max)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsAdjusting(true)}
                            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                        >
                            Adjust Position
                        </button>
                        <button
                            onClick={() => setShowAutomation(true)}
                            className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
                        >
                            Automation Settings
                        </button>
                    </div>

                    {isAdjusting && (
                        <AdjustPositionModal
                            position={position}
                            metrics={metrics}
                            onClose={() => setIsAdjusting(false)}
                        />
                    )}

                    {showAutomation && (
                        <AutomationControls
                            position={position}
                            onClose={() => setShowAutomation(false)}
                        />
                    )}
                </div>
            </LoadingState>
        </ErrorBoundary>
    );
}