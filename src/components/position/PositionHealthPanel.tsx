import { IHealthMetrics } from '@/lib/saros/position-health';

interface PositionHealthPanelProps {
    health: IHealthMetrics;
}

export function PositionHealthPanel({ health }: PositionHealthPanelProps) {
    const healthColorClass = {
        LOW: 'bg-green-100 text-green-800',
        MEDIUM: 'bg-yellow-100 text-yellow-800',
        HIGH: 'bg-red-100 text-red-800'
    }[health.riskLevel];

    return (
        <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Position Health</h3>
            
            {/* Health Score */}
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-500">Health Score</span>
                    <div className={`px-3 py-1 rounded-full ${healthColorClass}`}>
                        {health.healthScore}/100
                    </div>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full">
                    <div
                        className={`h-full rounded-full ${
                            health.healthScore >= 80
                                ? 'bg-green-500'
                                : health.healthScore >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                        }`}
                        style={{ width: `${health.healthScore}%` }}
                    />
                </div>
            </div>

            {/* Warnings */}
            {health.warnings.length > 0 && (
                <div className="space-y-2">
                    {health.warnings.map((warning, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg ${
                                warning.severity === 'HIGH'
                                    ? 'bg-red-50 text-red-700'
                                    : warning.severity === 'MEDIUM'
                                    ? 'bg-yellow-50 text-yellow-700'
                                    : 'bg-blue-50 text-blue-700'
                            }`}
                        >
                            <div className="font-medium">{warning.message}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recommendations */}
            {health.recommendations.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Recommendations
                    </h4>
                    <ul className="space-y-1">
                        {health.recommendations.map((recommendation, index) => (
                            <li
                                key={index}
                                className="text-sm text-gray-600 flex items-start"
                            >
                                <svg
                                    className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                {recommendation}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}