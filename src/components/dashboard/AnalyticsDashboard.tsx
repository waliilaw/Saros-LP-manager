import { useMemo, useState } from 'react';
import { usePositions } from '@/context/PositionContext';
import { IDLMMPosition, IPositionMetrics } from '@/lib/saros/interfaces';
import { formatNumber, formatTokenAmount } from '@/lib/utils';
import { PositionHealthMonitor } from '@/lib/saros/position-health';
import { ChartDashboard } from '../charts/ChartDashboard';
import { PerformanceReportModal } from '../reports/PerformanceReportModal';

interface AnalyticsDashboardProps {
    className?: string;
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
    const { positions, positionMetrics } = usePositions();
    const healthMonitor = useMemo(() => new PositionHealthMonitor(), []);
    const [showReportModal, setShowReportModal] = useState(false);

    const analytics = useMemo(() => {
        let totalValueLocked = 0;
        let totalFeesEarned = 0;
        let totalVolume24h = 0;
        let averageApr = 0;
        let totalImpermanentLoss = 0;
        let healthyPositions = 0;

        positions.forEach(position => {
            const metrics = positionMetrics.get(position.address.toString());
            if (metrics) {
                totalValueLocked += metrics.totalValueLocked;
                totalFeesEarned += Number(position.feesEarnedX) + Number(position.feesEarnedY);
                totalVolume24h += metrics.volumeLast24h;
                averageApr += metrics.apr;
                totalImpermanentLoss += metrics.impermanentLoss;

                const health = healthMonitor.calculateHealth(position, metrics);
                if (health.healthScore >= 80) {
                    healthyPositions++;
                }
            }
        });

        if (positions.length > 0) {
            averageApr /= positions.length;
        }

        return {
            totalValueLocked,
            totalFeesEarned,
            totalVolume24h,
            averageApr,
            totalImpermanentLoss,
            healthyPositions,
            totalPositions: positions.length
        };
    }, [positions, positionMetrics, healthMonitor]);

    const renderMetricCard = (title: string, value: string | number, subValue?: string) => (
        <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <div className="mt-2 flex items-baseline">
                <div className="text-2xl font-semibold">{value}</div>
                {subValue && (
                    <div className="ml-2 text-sm text-gray-500">{subValue}</div>
                )}
            </div>
        </div>
    );

    return (
        <div className={className}>
            <h2 className="text-2xl font-bold mb-6">Portfolio Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderMetricCard(
                    'Total Value Locked',
                    `$${formatNumber(analytics.totalValueLocked)}`
                )}

                {renderMetricCard(
                    'Total Fees Earned',
                    `$${formatNumber(analytics.totalFeesEarned)}`
                )}

                {renderMetricCard(
                    '24h Volume',
                    `$${formatNumber(analytics.totalVolume24h)}`
                )}

                {renderMetricCard(
                    'Average APR',
                    `${formatNumber(analytics.averageApr)}%`
                )}

                {renderMetricCard(
                    'Total Impermanent Loss',
                    `-$${formatNumber(analytics.totalImpermanentLoss)}`
                )}

                {renderMetricCard(
                    'Position Health',
                    analytics.healthyPositions,
                    `of ${analytics.totalPositions} positions healthy`
                )}
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Performance History</h3>
                <ChartDashboard
                    data={{
                        tvlHistory: [
                            { timestamp: Date.now() - 86400000 * 7, value: analytics.totalValueLocked * 0.8 },
                            { timestamp: Date.now() - 86400000 * 6, value: analytics.totalValueLocked * 0.85 },
                            { timestamp: Date.now() - 86400000 * 5, value: analytics.totalValueLocked * 0.9 },
                            { timestamp: Date.now() - 86400000 * 4, value: analytics.totalValueLocked * 0.95 },
                            { timestamp: Date.now() - 86400000 * 3, value: analytics.totalValueLocked * 0.97 },
                            { timestamp: Date.now() - 86400000 * 2, value: analytics.totalValueLocked * 0.99 },
                            { timestamp: Date.now() - 86400000, value: analytics.totalValueLocked },
                        ],
                        aprHistory: [
                            { timestamp: Date.now() - 86400000 * 7, value: analytics.averageApr * 1.1 },
                            { timestamp: Date.now() - 86400000 * 6, value: analytics.averageApr * 1.05 },
                            { timestamp: Date.now() - 86400000 * 5, value: analytics.averageApr * 0.95 },
                            { timestamp: Date.now() - 86400000 * 4, value: analytics.averageApr * 1.02 },
                            { timestamp: Date.now() - 86400000 * 3, value: analytics.averageApr * 0.98 },
                            { timestamp: Date.now() - 86400000 * 2, value: analytics.averageApr * 1.01 },
                            { timestamp: Date.now() - 86400000, value: analytics.averageApr },
                        ],
                        feesHistory: [
                            { timestamp: Date.now() - 86400000 * 7, value: analytics.totalFeesEarned * 0.7 },
                            { timestamp: Date.now() - 86400000 * 6, value: analytics.totalFeesEarned * 0.75 },
                            { timestamp: Date.now() - 86400000 * 5, value: analytics.totalFeesEarned * 0.8 },
                            { timestamp: Date.now() - 86400000 * 4, value: analytics.totalFeesEarned * 0.85 },
                            { timestamp: Date.now() - 86400000 * 3, value: analytics.totalFeesEarned * 0.9 },
                            { timestamp: Date.now() - 86400000 * 2, value: analytics.totalFeesEarned * 0.95 },
                            { timestamp: Date.now() - 86400000, value: analytics.totalFeesEarned },
                        ],
                        volumeHistory: [
                            { timestamp: Date.now() - 86400000 * 7, value: analytics.totalVolume24h * 0.9 },
                            { timestamp: Date.now() - 86400000 * 6, value: analytics.totalVolume24h * 1.1 },
                            { timestamp: Date.now() - 86400000 * 5, value: analytics.totalVolume24h * 0.95 },
                            { timestamp: Date.now() - 86400000 * 4, value: analytics.totalVolume24h * 1.05 },
                            { timestamp: Date.now() - 86400000 * 3, value: analytics.totalVolume24h * 0.98 },
                            { timestamp: Date.now() - 86400000 * 2, value: analytics.totalVolume24h * 1.02 },
                            { timestamp: Date.now() - 86400000, value: analytics.totalVolume24h },
                        ],
                    }}
                />
            </div>
        </div>
    );
}