import { IDLMMPosition, IPositionMetrics } from './interfaces';

export interface PerformanceReport {
    timestamp: number;
    positionId: string;
    tokenXDeposited: number;
    tokenYDeposited: number;
    feesEarnedX: number;
    feesEarnedY: number;
    totalValueLocked: number;
    apr: number;
    impermanentLoss: number;
    volumeLast24h: number;
    binUtilization: number;
    healthScore: number;
}

export class ReportsService {
    generateReport(
        position: IDLMMPosition,
        metrics: IPositionMetrics
    ): PerformanceReport {
        return {
            timestamp: Date.now(),
            positionId: position.address.toString(),
            tokenXDeposited: 100, // Simplified for demo
            tokenYDeposited: 200, // Simplified for demo
            feesEarnedX: 5, // Simplified for demo
            feesEarnedY: 10, // Simplified for demo
            totalValueLocked: 1000, // Simplified for demo
            apr: metrics.apr,
            impermanentLoss: metrics.impermanentLoss,
            volumeLast24h: metrics.volume24h,
            binUtilization: metrics.utilization,
            healthScore: position.healthFactor,
        };
    }

    generateCSV(reports: PerformanceReport[]): string {
        const headers = [
            'Timestamp',
            'Position ID',
            'Token X Deposited',
            'Token Y Deposited',
            'Fees Earned X',
            'Fees Earned Y',
            'Total Value Locked',
            'APR (%)',
            'Impermanent Loss',
            'Volume (24h)',
            'Bin Utilization (%)',
            'Health Score'
        ];

        const rows = reports.map(report => [
            new Date(report.timestamp).toISOString(),
            report.positionId,
            report.tokenXDeposited.toString(),
            report.tokenYDeposited.toString(),
            report.feesEarnedX.toString(),
            report.feesEarnedY.toString(),
            report.totalValueLocked.toString(),
            report.apr.toString(),
            report.impermanentLoss.toString(),
            report.volumeLast24h.toString(),
            (report.binUtilization * 100).toString(),
            report.healthScore.toString()
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    generateJSON(reports: PerformanceReport[]): string {
        return JSON.stringify(reports, null, 2);
    }
}