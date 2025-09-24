import { IDLMMPosition, IPositionMetrics } from './interfaces';
import { NotificationManager } from '../notifications/manager';

export interface IHealthMetrics {
    healthScore: number; // 0-100 score based on various factors
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    warnings: HealthWarning[];
    recommendations: string[];
}

export interface HealthWarning {
    type: HealthWarningType;
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type HealthWarningType = 
    | 'PRICE_RANGE_DEVIATION'
    | 'LOW_LIQUIDITY'
    | 'HIGH_IL_RISK'
    | 'UNDERPERFORMING'
    | 'CONCENTRATION_RISK';

export class PositionHealthMonitor {
    private readonly IL_THRESHOLD = 5; // 5% IL threshold
    private readonly PRICE_DEVIATION_THRESHOLD = 20; // 20% from optimal range
    private readonly MIN_LIQUIDITY_THRESHOLD = 1000; // $1000 minimum liquidity

    calculateHealth(position: IDLMMPosition, metrics: IPositionMetrics): IHealthMetrics {
        const warnings: HealthWarning[] = [];
        const recommendations: string[] = [];
        const notificationManager = NotificationManager.getInstance();

        // Check price range deviation
        const priceDeviation: { warning?: HealthWarning, recommendation?: string } = this.checkPriceRangeDeviation(metrics);
        if (priceDeviation.warning) {
            warnings.push(priceDeviation.warning);
            if (priceDeviation.recommendation) {
                recommendations.push(priceDeviation.recommendation);
            }
            
            if (priceDeviation.warning.severity === 'HIGH') {
                notificationManager.addNotification({
                    type: 'warning',
                    title: 'Position Price Range Alert',
                    message: priceDeviation.warning.message,
                    positionId: position.address.toString()
                });
            }
        }

        // Check liquidity levels
        const liquidity = this.checkLiquidityLevels(metrics);
        if (liquidity.warning) {
            warnings.push(liquidity.warning);
            if (liquidity.recommendation) {
                recommendations.push(liquidity.recommendation);
            }
        }

        // Check impermanent loss risk
        const ilRisk = this.checkImpermanentLossRisk(metrics);
        if (ilRisk.warning) {
            warnings.push(ilRisk.warning);
            if (ilRisk.recommendation) {
                recommendations.push(ilRisk.recommendation);
            }
        }

        // Check performance
        const performance = this.checkPerformance(metrics);
        if (performance.warning) {
            warnings.push(performance.warning);
            if (performance.recommendation) {
                recommendations.push(performance.recommendation);
            }
        }

        // Calculate overall health score
        const healthScore = this.calculateHealthScore(warnings);
        const riskLevel = this.determineRiskLevel(healthScore);

        return {
            healthScore,
            riskLevel,
            warnings,
            recommendations
        };
    }

    private checkPriceRangeDeviation(metrics: any) {
        const currentPrice = metrics.priceRange.current;
        const optimalMin = metrics.priceRange.min;
        const optimalMax = metrics.priceRange.max;
        const deviation = Math.abs(
            ((currentPrice - (optimalMin + optimalMax) / 2) / ((optimalMin + optimalMax) / 2)) * 100
        );

        if (deviation > this.PRICE_DEVIATION_THRESHOLD) {
            return {
                warning: {
                    type: 'PRICE_RANGE_DEVIATION' as const,
                    message: `Price has deviated ${deviation.toFixed(2)}% from optimal range`,
                    severity: (deviation > 30 ? 'HIGH' : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH'
                },
                recommendation: 'Consider adjusting position range to optimize for current market conditions'
            };
        }

        return {};
    }

    private checkLiquidityLevels(metrics: any): { warning?: HealthWarning, recommendation?: string } {
        if (metrics.totalValueLocked < this.MIN_LIQUIDITY_THRESHOLD) {
            return {
                warning: {
                    type: 'LOW_LIQUIDITY',
                    message: 'Position liquidity is below recommended minimum',
                    severity: (metrics.totalValueLocked < this.MIN_LIQUIDITY_THRESHOLD / 2 ? 'HIGH' : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH'
                },
                recommendation: 'Consider adding more liquidity to improve position efficiency'
            };
        }

        return {};
    }

    private checkImpermanentLossRisk(metrics: any): { warning?: HealthWarning, recommendation?: string } {
        const ilPercentage = (metrics.impermanentLoss / metrics.totalValueLocked) * 100;

        if (ilPercentage > this.IL_THRESHOLD) {
            const severity = (ilPercentage > 10 ? 'HIGH' : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH';
            return {
                warning: {
                    type: 'HIGH_IL_RISK',
                    message: `High impermanent loss risk (${ilPercentage.toFixed(2)}%)`,
                    severity
                },
                recommendation: 'Consider adjusting position range or reducing exposure'
            };
        }

        return {};
    }

    private checkPerformance(metrics: any): { warning?: HealthWarning, recommendation?: string } {
        const expectedDailyFees = metrics.totalValueLocked * (metrics.apr / 365 / 100);
        const actualDailyFees = metrics.feesLast24h;

        if (actualDailyFees < expectedDailyFees * 0.7) { // Underperforming by 30% or more
            const severity = (actualDailyFees < expectedDailyFees * 0.5 ? 'HIGH' : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH';
            return {
                warning: {
                    type: 'UNDERPERFORMING',
                    message: 'Position is underperforming expected returns',
                    severity
                },
                recommendation: 'Review position parameters and market conditions for optimization opportunities'
            };
        }

        return {};
    }

    private calculateHealthScore(warnings: HealthWarning[]): number {
        let score = 100;
        
        for (const warning of warnings) {
            switch (warning.severity) {
                case 'HIGH':
                    score -= 30;
                    break;
                case 'MEDIUM':
                    score -= 15;
                    break;
                case 'LOW':
                    score -= 5;
                    break;
            }
        }

        return Math.max(0, Math.min(100, score));
    }

    private determineRiskLevel(healthScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
        if (healthScore >= 80) return 'LOW';
        if (healthScore >= 50) return 'MEDIUM';
        return 'HIGH';
    }
}