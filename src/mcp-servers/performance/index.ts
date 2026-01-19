import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
    name: 'jellyfin-performance',
    version: '1.0.0'
});

function createTool(name: string, description: string, schema: object, handler: Function) {
    // @ts-expect-error - SDK types are too strict for runtime use
    server.tool(name, description, schema, handler);
}

createTool(
    'get_monitoring_overview',
    'Get overview of Jellyfin performance monitoring system',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    components: [
                        {
                            name: 'PerformanceCollector',
                            purpose: 'Collects and stores performance samples with statistical analysis',
                            file: 'src/utils/performanceBaseline.ts',
                            features: [
                                'Sample collection with automatic buffer management',
                                'Statistical analysis (avg, min, max, p95, stddev)',
                                'Async and sync measurement wrappers',
                                'Baseline comparison and threshold verification'
                            ]
                        },
                        {
                            name: 'createStoreMonitor',
                            purpose: 'Factory for creating store-specific performance monitors',
                            usage: 'Wraps store operations to track execution time',
                            example: "const monitor = createStoreMonitor('mediaStore');"
                        },
                        {
                            name: 'measureStorePerformance',
                            purpose: 'Runs baseline measurement for all store operations',
                            duration: '10 seconds collection period',
                            operations: [
                                'mediaStore.read', 'mediaStore.write',
                                'mediaStore.play', 'mediaStore.pause',
                                'queueStore.read', 'queueStore.write', 'queueStore.next',
                                'playerStore.read', 'playerStore.write',
                                'settingsStore.read', 'settingsStore.write'
                            ]
                        },
                        {
                            name: 'comparePerformanceReports',
                            purpose: 'Compares two performance reports to identify changes',
                            thresholds: {
                                improvement: '< -5% change (faster)',
                                degradation: '> +5% change (slower)',
                                unchanged: '±5% range'
                            }
                        },
                        {
                            name: 'verifyPerformanceThresholds',
                            purpose: 'Checks if operations meet performance thresholds',
                            threshold: '10ms per operation',
                            action: 'Logs warning if exceeded'
                        }
                    ],
                    metrics: {
                        SAMPLE_SIZE: 50,
                        COLLECTION_DURATION_MS: 10000,
                        DEFAULT_THRESHOLD_MS: 10
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_baseline_data_structure',
    'Get TypeScript interfaces for performance data structures',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    PerformanceSample: {
                        operation: 'string - Name of the operation being measured',
                        durationMs: 'number - Execution time in milliseconds',
                        timestamp: 'number - Unix timestamp when sample was taken'
                    },
                    PerformanceBaseline: {
                        operation: 'string - Operation name',
                        samples: 'number[] - All duration measurements',
                        averageMs: 'number - Mean execution time',
                        minMs: 'number - Fastest execution',
                        maxMs: 'number - Slowest execution',
                        percentile95: 'number - 95th percentile (p95)',
                        standardDeviation: 'number - Variability measure',
                        timestamp: 'number - When baseline was calculated'
                    },
                    PerformanceReport: {
                        baselines: 'PerformanceBaseline[] - Results for each operation',
                        summary: {
                            totalOperations: 'number - Total samples collected',
                            overallAverageMs: 'number - Average across all operations',
                            violations: 'number - Operations exceeding threshold'
                        },
                        timestamp: 'string - When report was generated'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_threshold_config',
    'Get performance thresholds and what happens when exceeded',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    defaultThreshold: '10ms per store operation',
                    thresholdActions: {
                        below: {
                            condition: 'averageMs <= 10',
                            action: 'Pass - operation is fast enough',
                            log: 'info: All performance thresholds passed'
                        },
                        above: {
                            condition: 'averageMs > 10',
                            action: 'Fail - operation needs optimization',
                            log: 'warn: Performance threshold exceeded with operation and actual time'
                        }
                    },
                    storeOperationThresholds: {
                        'mediaStore.read': { ideal: '< 5ms', warning: '> 10ms' },
                        'mediaStore.write': { ideal: '< 3ms', warning: '> 8ms' },
                        'mediaStore.play': { ideal: '< 10ms', warning: '> 20ms' },
                        'mediaStore.pause': { ideal: '< 5ms', warning: '> 10ms' },
                        'queueStore.read': { ideal: '< 2ms', warning: '> 5ms' },
                        'queueStore.write': { ideal: '< 3ms', warning: '> 8ms' },
                        'queueStore.next': { ideal: '< 5ms', warning: '> 15ms' },
                        'playerStore.read': { ideal: '< 2ms', warning: '> 5ms' },
                        'playerStore.write': { ideal: '< 2ms', warning: '> 5ms' },
                        'settingsStore.read': { ideal: '< 1ms', warning: '> 3ms' },
                        'settingsStore.write': { ideal: '< 5ms', warning: '> 10ms' }
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_patterns_and_patterns',
    'Understand performance patterns and optimization strategies',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    patterns: [
                        {
                            name: 'Selective Subscriptions',
                            purpose: 'Prevent unnecessary re-renders',
                            implementation: 'useStore(state => state.specificField)',
                            impact: 'Reduces render frequency significantly'
                        },
                        {
                            name: 'Store Monitor Wrapper',
                            purpose: 'Measure operation performance without code changes',
                            usage: "const stop = monitor.start('operation'); // ... ; stop();",
                            alternative: "monitor.measure('operation', async () => fn())"
                        },
                        {
                            name: 'Performance Collector',
                            purpose: 'Aggregate samples for statistical analysis',
                            features: ['Automatic sample buffering', 'Statistical calculations', 'Threshold checking']
                        },
                        {
                            name: 'Baseline Comparison',
                            purpose: 'Detect performance regressions',
                            method: 'Compare current report against stored baseline',
                            thresholds: { improved: '< -5%', degraded: '> +5%' }
                        }
                    ],
                    antiPatterns: [
                        {
                            issue: 'Subscribing to entire store',
                            problem: 'Re-renders on ANY state change',
                            fix: 'Use selective subscriptions: state => state.specificField'
                        },
                        {
                            issue: 'Missing useEffect cleanup',
                            problem: 'Subscriptions persist after unmount',
                            fix: 'Return cleanup function in useEffect'
                        },
                        {
                            issue: 'Synchronous heavy operations in stores',
                            problem: 'Blocks UI thread',
                            fix: 'Move to async actions or web workers'
                        }
                    ],
                    optimizationStrategies: [
                        'Split large stores into focused micro-stores',
                        'Use subscribeWithSelector for fine-grained subscriptions',
                        'Batch related state updates',
                        'Memoize expensive derived calculations'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_monitoring_workflow',
    'Understand how performance monitoring is used in development',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    developmentWorkflow: [
                        {
                            step: 1,
                            action: 'measureStorePerformance()',
                            duration: '10 seconds',
                            result: 'PerformanceReport with baselines for all operations'
                        },
                        {
                            step: 2,
                            action: 'verifyPerformanceThresholds(report)',
                            result: 'Boolean indicating if all operations meet thresholds'
                        },
                        {
                            step: 3,
                            action: 'Store report as baseline',
                            purpose: 'Compare future changes against this baseline'
                        },
                        {
                            step: 4,
                            action: 'After changes, run measureStorePerformance() again',
                            result: 'New PerformanceReport'
                        },
                        {
                            step: 5,
                            action: 'comparePerformanceReports(baseline, current)',
                            result: '{ improved: [], degraded: [], unchanged: [] }'
                        }
                    ],
                    realTimeMonitoring: [
                        'createStoreMonitor returns wrapper with start/stop methods',
                        'Call start() before operation, stop() after',
                        'Samples are automatically recorded',
                        'Can check samples with getSamples(operation)'
                    ],
                    debuggingSlowOperations: [
                        '1. Run measureStorePerformance() to get baseline',
                        '2. Identify operations with high average or p95',
                        '3. Use createStoreMonitor to measure specific actions',
                        '4. Check for anti-patterns (over-subscription, blocking code)',
                        '5. Optimize and re-run measurement'
                    ]
                }, null, 2)
            }]
        };
    }
);

server.resource(
    'performance-docs',
    'jellyfin://performance/monitoring',
    async () => {
        return {
            contents: [{
                uri: 'jellyfin://performance/monitoring',
                mimeType: 'text/markdown',
                text: `# Jellyfin Performance Monitoring

## Overview
Performance monitoring system for tracking store operation execution times and detecting regressions.

## Architecture
\`\`\`
┌─────────────────────┐     ┌─────────────────────┐
│  createStoreMonitor │────▶│ PerformanceCollector│
│  (per-store wrapper)│     │  (sample aggregation)│
└─────────────────────┘     └──────────┬──────────┘
                                       │
                                       ▼
                        ┌─────────────────────────────┐
                        │  PerformanceBaseline        │
                        │  - averageMs                │
                        │  - percentile95             │
                        │  - standardDeviation        │
                        └─────────────────────────────┘
                                       │
                                       ▼
                        ┌─────────────────────────────┐
                        │  Threshold Verification     │
                        │  (10ms default threshold)   │
                        └─────────────────────────────┘
\`\`\`

## Usage

### Quick Performance Check
\`\`\`typescript
import { measureStorePerformance, verifyPerformanceThresholds } from 'utils/performanceBaseline';

const report = await measureStorePerformance();
const passed = verifyPerformanceThresholds(report);
\`\`\`

### Monitor Specific Operation
\`\`\`typescript
const monitor = createStoreMonitor('mediaStore');
const stop = monitor.start('play');

// ... perform the operation ...
stop();
\`\`\`

### Compare to Baseline
\`\`\`typescript
import { comparePerformanceReports } from 'utils/performanceBaseline';

const comparison = comparePerformanceReports(baselineReport, currentReport);
console.log('Degraded:', comparison.degraded);
console.log('Improved:', comparison.improved);
\`\`\`

## Key Metrics

| Metric | Description | Good | Warning |
|--------|-------------|------|---------|
| averageMs | Mean execution time | < 5ms | > 10ms |
| percentile95 | 95th percentile | < 10ms | > 20ms |
| standardDeviation | Variability | < 2ms | > 5ms |
| violations | Operations over threshold | 0 | > 0 |

## Files
- \`src/utils/performanceBaseline.ts\` - Main implementation
- \`src/store/types/quality.ts\` - Quality metrics types
`
            }]
        };
    }
);

const transport = new StdioServerTransport();
await server.connect(transport);
