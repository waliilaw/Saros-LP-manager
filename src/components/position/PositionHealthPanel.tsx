import { IHealthMetrics } from '@/lib/saros/position-health';

interface PositionHealthPanelProps {
    health: IHealthMetrics;
}

export function PositionHealthPanel({ health }: PositionHealthPanelProps) {
    const colorMap = {
        LOW: 'bg-green-100 text-green-800',
        MEDIUM: 'bg-yellow-100 text-yellow-800',
        HIGH: 'bg-red-100 text-red-800'
    };

    const healthColorClass = colorMap[health.riskLevel];

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Position Health</h3>
                <span className={`px-3 py-1 rounded-full text-sm ${healthColorClass}`}>
                    {health.status}
                </span>
            </div>
            
            <div className="space-y-4">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Health Score</span>
                        <span className="font-medium">{health.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full ${healthColorClass}`}
                            style={{ width: `${health.score}%` }}
                        />
                    </div>
                </div>

                {health.issues.length > 0 && (
                    <div>
                        <h4 className="font-medium mb-2">Issues</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {health.issues.map((issue, index) => (
                                <li key={index} className="text-sm text-gray-600">{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {health.recommendations.length > 0 && (
                    <div>
                        <h4 className="font-medium mb-2">Recommendations</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {health.recommendations.map((rec, index) => (
                                <li key={index} className="text-sm text-gray-600">{rec}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}