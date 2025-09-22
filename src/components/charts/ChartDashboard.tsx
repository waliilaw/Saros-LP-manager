import { PerformanceChart } from './PerformanceChart';
import { useMemo } from 'react';

interface ChartData {
    tvlHistory: { timestamp: number; value: number }[];
    aprHistory: { timestamp: number; value: number }[];
    feesHistory: { timestamp: number; value: number }[];
    volumeHistory: { timestamp: number; value: number }[];
}

interface ChartDashboardProps {
    data: ChartData;
    className?: string;
}

export function ChartDashboard({ data, className }: ChartDashboardProps) {
    return (
        <div className={className}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PerformanceChart
                    data={data.tvlHistory}
                    title="Total Value Locked"
                    valuePrefix="$"
                />
                <PerformanceChart
                    data={data.aprHistory}
                    title="Average APR"
                    valueSuffix="%"
                />
                <PerformanceChart
                    data={data.feesHistory}
                    title="Cumulative Fees"
                    valuePrefix="$"
                />
                <PerformanceChart
                    data={data.volumeHistory}
                    title="Trading Volume"
                    valuePrefix="$"
                />
            </div>
        </div>
    );
}