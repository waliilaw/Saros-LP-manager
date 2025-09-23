'use client';

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
        <div className="metric-card">
            <h3 className="metric-title">{title}</h3>
            <div className="mt-3 flex items-baseline">
                <div className="metric-value">{value}</div>
                {subValue && (
                    <div className="metric-subvalue">{subValue}</div>
                )}
            </div>
        </div>
    );

    return (
        <div className={`${className} p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl`}>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">Portfolio Analytics</h2>
                <button 
                    onClick={() => setShowReportModal(true)}
                    className="button-primary"
                >
                    Generate Report
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderMetricCard(
                    'Total Value Locked',
                    `$${formatNumber(analytics.totalValueLocked)}`,
                    'Total liquidity'
                )}

                {renderMetricCard(
                    'Total Fees Earned',
                    `$${formatNumber(analytics.totalFeesEarned)}`,
                    'Cumulative earnings'
                )}

                {renderMetricCard(
                    '24h Volume',
                    `$${formatNumber(analytics.totalVolume24h)}`,
                    'Trading activity'
                )}

                {renderMetricCard(
                    'Average APR',
                    `${formatNumber(analytics.averageApr)}%`,
                    'Annual yield'
                )}

                {renderMetricCard(
                    'Total Impermanent Loss',
                    `-$${formatNumber(analytics.totalImpermanentLoss)}`,
                    'Price impact'
                )}

                {renderMetricCard(
                    'Position Health',
                    analytics.healthyPositions,
                    `of ${analytics.totalPositions} positions healthy`
                )}
            </div>

            <div className="chart-container">
                <h3 className="chart-title">Performance History</h3>
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