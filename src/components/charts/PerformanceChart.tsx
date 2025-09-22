import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { formatNumber } from '@/lib/utils';

interface TimeSeriesData {
    timestamp: number;
    value: number;
}

interface PerformanceChartProps {
    data: TimeSeriesData[];
    title: string;
    valuePrefix?: string;
    valueSuffix?: string;
}

export function PerformanceChart({ data, title, valuePrefix = '', valueSuffix = '' }: PerformanceChartProps) {
    const formatValue = (value: number) => {
        return `${valuePrefix}${formatNumber(value)}${valueSuffix}`;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-4">{title}</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={formatDate}
                            minTickGap={50}
                        />
                        <YAxis tickFormatter={formatValue} />
                        <Tooltip
                            labelFormatter={formatDate}
                            formatter={(value: number) => [formatValue(value), title]}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#4F46E5"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 8 }}
                            name={title}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}