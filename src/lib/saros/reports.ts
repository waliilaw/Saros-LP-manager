import { IDLMMPosition, IPositionMetrics } from './interfaces';

export interface PerformanceReport {
    timestamp: number;
    positionId: string;
    tokenXDeposited: bigint;
    tokenYDeposited: bigint;
    feesEarnedX: bigint;
    feesEarnedY: bigint;
    totalValueLocked: number;
    apr: number;
    impermanentLoss: number;
    volumeLast24h: number;
    binUtilization: number;
    healthScore: number;
}

export class ReportGenerator {
    generatePositionReport(
        position: IDLMMPosition,
        metrics: IPositionMetrics
    ): PerformanceReport {
        return {
            timestamp: Date.now(),
            positionId: position.address.toString(),
            tokenXDeposited: position.tokenXDeposited,
            tokenYDeposited: position.tokenYDeposited,
            feesEarnedX: position.feesEarnedX,
            feesEarnedY: position.feesEarnedY,
            totalValueLocked: metrics.totalValueLocked,
            apr: metrics.apr,
            impermanentLoss: metrics.impermanentLoss,
            volumeLast24h: metrics.volumeLast24h,
            binUtilization: metrics.binUtilization,
            healthScore: metrics.healthScore || 0,
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
            'APR',
            'Impermanent Loss',
            '24h Volume',
            'Bin Utilization',
            'Health Score',
        ];

        const rows = reports.map(report => [
            new Date(report.timestamp).toISOString(),
            report.positionId,
            report.tokenXDeposited.toString(),
            report.tokenYDeposited.toString(),
            report.feesEarnedX.toString(),
            report.feesEarnedY.toString(),
            report.totalValueLocked.toFixed(2),
            report.apr.toFixed(2),
            report.impermanentLoss.toFixed(2),
            report.volumeLast24h.toFixed(2),
            report.binUtilization.toFixed(2),
            report.healthScore.toFixed(2),
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ].join('\n');
    }

    downloadCSV(reports: PerformanceReport[], filename: string = 'performance-report.csv'): void {
        const csv = this.generateCSV(reports);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (navigator.msSaveBlob) {
            // IE 10+
            navigator.msSaveBlob(blob, filename);
            return;
        }

        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}