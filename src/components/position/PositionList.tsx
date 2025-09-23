'use client';

import { usePositions } from '@/context/PositionContext';
import { IDLMMPosition, IPositionMetrics } from '@/lib/saros/interfaces';
import { formatNumber } from '@/lib/utils';
import { useCallback, useState } from 'react';
import { PositionDetails } from './PositionDetails';
import { AdjustPositionModal } from './AdjustPositionModal';

export function PositionList() {
    const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
    const [adjustingPosition, setAdjustingPosition] = useState<string | null>(null);
    const { positions, positionMetrics, loading, error, refreshPositions } = usePositions();

    const renderMetrics = useCallback((position: IDLMMPosition) => {
        const metrics = positionMetrics.get(position.address.toString());
        if (!metrics) return null;

        return (
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                    <div className="text-gray-500">TVL</div>
                    <div className="font-medium">${formatNumber(metrics.totalValueLocked)}</div>
                </div>
                <div>
                    <div className="text-gray-500">APR</div>
                    <div className="font-medium">{formatNumber(metrics.apr)}%</div>
                </div>
                <div>
                    <div className="text-gray-500">24h Volume</div>
                    <div className="font-medium">${formatNumber(metrics.volumeLast24h)}</div>
                </div>
                <div>
                    <div className="text-gray-500">24h Fees</div>
                    <div className="font-medium">${formatNumber(metrics.feesLast24h)}</div>
                </div>
            </div>
        );
    }, [positionMetrics]);

    const renderHealthIndicator = useCallback((metrics: IPositionMetrics) => {
        const getHealthColor = () => {
            if (metrics.binUtilization >= 70) return 'bg-green-500';
            if (metrics.binUtilization >= 40) return 'bg-yellow-500';
            return 'bg-red-500';
        };

        return (
            <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getHealthColor()}`} />
                <span className="text-sm text-gray-600">
                    {metrics.binUtilization}% utilized
                </span>
            </div>
        );
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                <div className="font-medium">Error loading positions</div>
                <div className="text-sm">{error}</div>
                <button
                    onClick={refreshPositions}
                    className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (positions.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-500">No active positions</div>
                <button
                    onClick={() => {}} // Will implement create position flow
                    className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    Create Position
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {positions.map((position) => {
                const metrics = positionMetrics.get(position.address.toString());
                return (
                    <div
                        key={position.address.toString()}
                        className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-medium">
                                    Position #{position.address.toString().slice(0, 8)}
                                </h3>
                                <div className="text-sm text-gray-500">
                                    Bins {position.lowerBinId} - {position.upperBinId}
                                </div>
                            </div>
                            {metrics && renderHealthIndicator(metrics)}
                        </div>
                        {renderMetrics(position)}
                        <div className="mt-4 flex space-x-2">
                            <button
                                onClick={() => setSelectedPosition(position.address.toString())}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                            >
                                Details
                            </button>
                            <button
                                onClick={() => setAdjustingPosition(position.address.toString())}
                                className="px-4 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                            >
                                Adjust
                            </button>
                        </div>
                    </div>
                );
            })}

            {selectedPosition && (
                <PositionDetails
                    positionId={selectedPosition}
                    onClose={() => setSelectedPosition(null)}
                />
            )}

            {adjustingPosition && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    {(() => {
                        const position = positions.find(p => p.address.toString() === adjustingPosition);
                        const metrics = position ? positionMetrics.get(adjustingPosition) : null;
                        
                        if (!position || !metrics) return null;
                        
                        return (
                            <AdjustPositionModal
                                position={position}
                                metrics={metrics}
                                onClose={() => setAdjustingPosition(null)}
                            />
                        );
                    })()}
                </div>
            )}
        </div>
    );
}