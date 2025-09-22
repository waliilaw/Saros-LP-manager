import { usePositions } from '@/context/PositionContext';
import { IDLMMPosition, IPositionMetrics } from '@/lib/saros/interfaces';
import { formatNumber, formatDate, formatPrice, formatTokenAmount } from '@/lib/utils';
import { useMemo, useState, Suspense } from 'react';
import { AdjustPositionModal } from './AdjustPositionModal';
import { PositionHealthPanel } from './PositionHealthPanel';
import { PositionHealthMonitor } from '@/lib/saros/position-health';
import { AutomationControls } from './AutomationControls';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingState, LoadingSkeleton } from '../common/LoadingStates';

interface PositionDetailsProps {
    positionId: string;
    onClose: () => void;
}

export function PositionDetails({ positionId, onClose }: PositionDetailsProps) {
    const { positions, positionMetrics } = usePositions();
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [showAutomation, setShowAutomation] = useState(false);
    const healthMonitor = useMemo(() => new PositionHealthMonitor(), []);

    const position = useMemo(() => 
        positions.find(p => p.address.toString() === positionId),
        [positions, positionId]
    );

    const metrics = useMemo(() => 
        position ? positionMetrics.get(positionId) : null,
        [position, positionMetrics, positionId]
    );

    const health = useMemo(() => 
        position && metrics ? healthMonitor.calculateHealth(position, metrics) : null,
        [position, metrics, healthMonitor]
    );

    if (!position || !metrics) {
        return (
            <LoadingSkeleton className="p-4">
                <div className="text-gray-500">Loading position details...</div>
            </LoadingSkeleton>
        );
    }

    return (
        <ErrorBoundary>
            <LoadingState isLoading={!position || !metrics}>
                <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-semibold">
                            Position #{positionId.slice(0, 8)}
                        </h2>
                        <div className="text-gray-500 mt-1">
                            Created {formatDate(position.lastUpdatedAt)}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Position Overview */}
                <div className="mt-6 grid grid-cols-2 gap-6">
                    <div>
                        <div className="text-gray-500">Total Value Locked</div>
                        <div className="text-2xl font-semibold">
                            ${formatNumber(metrics.totalValueLocked)}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-500">Current APR</div>
                        <div className="text-2xl font-semibold">
                            {formatNumber(metrics.apr)}%
                        </div>
                    </div>
                </div>

                {/* Token Amounts */}
                <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Token Deposits</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-gray-500">Token X</div>
                            <div className="mt-1 font-medium">
                                {formatTokenAmount(
                                    Number(position.tokenXDeposited),
                                    'X',
                                    6
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-gray-500">Token Y</div>
                            <div className="mt-1 font-medium">
                                {formatTokenAmount(
                                    Number(position.tokenYDeposited),
                                    'Y',
                                    6
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price Range */}
                <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Price Range</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <div className="text-gray-500">Min Price</div>
                                <div className="mt-1 font-medium">
                                    ${formatPrice(metrics.priceRange.min)}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500">Current Price</div>
                                <div className="mt-1 font-medium">
                                    ${formatPrice(metrics.priceRange.current)}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500">Max Price</div>
                                <div className="mt-1 font-medium">
                                    ${formatPrice(metrics.priceRange.max)}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 h-2 bg-gray-200 rounded-full">
                            <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{
                                    width: `${metrics.binUtilization}%`
                                }}
                            />
                        </div>
                        <div className="mt-2 text-sm text-gray-500 text-center">
                            {metrics.binUtilization}% Utilized
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Performance</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-gray-500">24h Volume</div>
                            <div className="mt-1 font-medium">
                                ${formatNumber(metrics.volumeLast24h)}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-gray-500">24h Fees Earned</div>
                            <div className="mt-1 font-medium">
                                ${formatNumber(metrics.feesLast24h)}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-gray-500">Impermanent Loss</div>
                            <div className="mt-1 font-medium text-red-600">
                                -${formatNumber(metrics.impermanentLoss)}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-gray-500">Total Fees Earned</div>
                            <div className="mt-1 font-medium">
                                ${formatNumber(
                                    Number(position.feesEarnedX) + Number(position.feesEarnedY)
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Health Panel */}
                {health && <PositionHealthPanel health={health} />}

                {/* Action Buttons */}
                <div className="mt-8 flex space-x-4">
                    <button
                        onClick={() => setIsAdjusting(true)}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        Adjust Position
                    </button>
                    <button
                        onClick={() => setShowAutomation(true)}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                        Automation Settings
                    </button>
                </div>
            </div>

            {/* Position Adjustment Modal */}
            {isAdjusting && (
                <AdjustPositionModal
                    position={position}
                    metrics={metrics}
                    onClose={() => setIsAdjusting(false)}
                />
            )}

            {/* Automation Controls Modal */}
            {showAutomation && (
                <AutomationControls
                    positionId={positionId}
                    onClose={() => setShowAutomation(false)}
                />
            )}
        </div>
    );
}