/**
 * Quality Metrics Types
 *
 * Defines types for tracking and measuring quality metrics throughout the migration.
 */

export type MediaType = 'Audio' | 'Video' | 'Photo' | 'Book' | 'Unknown';

export type RepeatMode = 'RepeatNone' | 'RepeatAll' | 'RepeatOne';

export type ShuffleMode = 'Sorted' | 'Shuffle';

export type PlaybackStatus = 'idle' | 'buffering' | 'playing' | 'paused' | 'stopped' | 'error';

export interface QualityMetrics {
    performance: PerformanceMetrics;
    reliability: ReliabilityMetrics;
    ux: UXMetrics;
    maintainability: MaintainabilityMetrics;
    testability: TestabilityMetrics;
    security: SecurityMetrics;
}

export interface PerformanceMetrics {
    storeUpdateMs: number;
    renderMs: number;
    memoryDelta: number;
    networkLatency: number;
    criticalPaths: {
        audioPlayback: number;
        videoPlayback: number;
        mediaSessionUpdate: number;
        playerTransfer: number;
        settingsSave: number;
    };
}

export interface ReliabilityMetrics {
    errorRate: number;
    crashCount: number;
    recoveryTime: number;
    fallbackSuccessRate: number;
    errorTypes: {
        network: number;
        playback: number;
        transcode: number;
        state: number;
    };
}

export interface UXMetrics {
    accessibilityScore: number;
    consistencyViolations: number;
    responseTimeScore: number;
    userFeedbackScore: number;
}

export interface MaintainabilityMetrics {
    typeErrors: number;
    lintErrors: number;
    coveragePercent: number;
    codeComplexity: number;
    documentationCompleteness: number;
}

export interface TestabilityMetrics {
    criticalPathCoverage: number;
    integrationCoverage: number;
    e2eCoverage: number;
    flakyTestCount: number;
    testExecutionTime: number;
}

export interface SecurityMetrics {
    inputValidationErrors: number;
    xssVulnerabilities: number;
    dataExposureRisks: number;
    authenticationFailures: number;
}

export interface QualityThreshold {
    metric: string;
    warning: number;
    critical: number;
    unit: string;
}

export const QUALITY_THRESHOLDS: QualityThreshold[] = [
    { metric: 'storeUpdateMs', warning: 10, critical: 50, unit: 'ms' },
    { metric: 'renderMs', warning: 50, critical: 100, unit: 'ms' },
    { metric: 'memoryDelta', warning: 50, critical: 100, unit: 'MB' },
    { metric: 'errorRate', warning: 0.01, critical: 0.05, unit: 'percent' },
    { metric: 'crashCount', warning: 0, critical: 1, unit: 'count' },
    { metric: 'accessibilityScore', warning: 95, critical: 80, unit: 'percent' },
    { metric: 'typeErrors', warning: 0, critical: 0, unit: 'count' },
    { metric: 'lintErrors', warning: 0, critical: 0, unit: 'count' },
    { metric: 'criticalPathCoverage', warning: 95, critical: 80, unit: 'percent' }
];

export interface QualityReport {
    timestamp: string;
    phase: number;
    metrics: QualityMetrics;
    passed: boolean;
    violations: QualityViolation[];
    recommendations: string[];
}

export interface QualityViolation {
    metric: string;
    actual: number;
    threshold: number;
    severity: 'warning' | 'critical';
}

export interface QualityStatus {
    overall: 'passed' | 'warning' | 'failed';
    performance: 'passed' | 'warning' | 'failed';
    reliability: 'passed' | 'warning' | 'failed';
    ux: 'passed' | 'warning' | 'failed';
    maintainability: 'passed' | 'warning' | 'failed';
    testability: 'passed' | 'warning' | 'failed';
    security: 'passed' | 'warning' | 'failed';
}

/**
 * Calculate quality status based on thresholds
 */
export function calculateQualityStatus(metrics: QualityMetrics): QualityStatus {
    const checkThreshold = (
        value: number,
        warning: number,
        critical: number
    ): 'passed' | 'warning' | 'failed' => {
        if (value >= critical) return 'failed';
        if (value >= warning) return 'warning';
        return 'passed';
    };

    return {
        overall: 'passed', // Will be calculated based on all categories
        performance: checkThreshold(metrics.performance.storeUpdateMs, 10, 50),
        reliability: checkThreshold(metrics.reliability.errorRate, 0.01, 0.05),
        ux: checkThreshold(metrics.ux.accessibilityScore, 95, 80),
        maintainability: checkThreshold(metrics.maintainability.typeErrors, 0, 0),
        testability: checkThreshold(metrics.testability.criticalPathCoverage, 95, 80),
        security: checkThreshold(metrics.security.inputValidationErrors, 0, 0)
    };
}

/**
 * Check if quality meets threshold
 */
export function meetsThreshold(actual: number, warning: number, critical: number): boolean {
    return actual < warning;
}

/**
 * Generate quality recommendations based on violations
 */
export function generateRecommendations(violations: QualityViolation[]): string[] {
    const recommendations: string[] = [];

    for (const violation of violations) {
        switch (violation.metric) {
            case 'storeUpdateMs':
                recommendations.push(
                    'Consider optimizing store selectors or reducing state update frequency'
                );
                break;
            case 'errorRate':
                recommendations.push(
                    'Review error handling patterns and add more graceful fallbacks'
                );
                break;
            case 'accessibilityScore':
                recommendations.push('Audit UI components for ARIA labels and keyboard navigation');
                break;
            case 'criticalPathCoverage':
                recommendations.push('Add more tests for critical user journeys');
                break;
            default:
                recommendations.push(`Review and optimize ${violation.metric}`);
        }
    }

    return recommendations;
}
