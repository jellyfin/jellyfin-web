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
    'get_performance_relationships',
    'Understand how performance relates to other MCP servers',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    relatedMcpServers: [
                        {
                            server: 'store-architecture',
                            relationship: 'Performance monitors store operations',
                            direction: 'Performance → Store',
                            integration: 'createStoreMonitor wraps store actions'
                        },
                        {
                            server: 'components',
                            relationship: 'Performance affects component rendering',
                            direction: 'Performance → Component',
                            integration: 'Virtualization, memoization recommendations'
                        },
                        {
                            server: 'api',
                            relationship: 'Preloading optimizes API calls',
                            direction: 'Performance → API',
                            integration: 'PredictivePreloader, imageLoader'
                        },
                        {
                            server: 'audio-engine',
                            relationship: 'Audio worklet performance tracked',
                            direction: 'Performance → Audio',
                            integration: 'Worklet loading time monitoring'
                        },
                        {
                            server: 'architecture',
                            relationship: 'Performance is the optimization layer',
                            direction: 'Monitoring, caching, preloading across system',
                            integration: 'Applies to all layers'
                        }
                    ],
                    monitoringTargets: [
                        {
                            layer: 'Store Operations',
                            metrics: ['action execution time', 'subscription overhead'],
                            tools: ['createStoreMonitor', 'PerformanceCollector'],
                            file: 'src/utils/performanceBaseline.ts'
                        },
                        {
                            layer: 'API Calls',
                            metrics: ['fetch time', 'cache hit rate', 'preload effectiveness'],
                            tools: ['PreloadPerformanceMonitor', 'imageLoader'],
                            file: 'src/utils/preload/'
                        },
                        {
                            layer: 'Component Rendering',
                            metrics: ['render time', 're-render frequency'],
                            tools: ['React DevTools', 'why-did-you-render'],
                            file: 'src/components/'
                        },
                        {
                            layer: 'Audio Processing',
                            metrics: ['worklet load time', 'buffer underrun'],
                            tools: ['AudioContext timing'],
                            file: 'src/components/audioEngine/'
                        }
                    ],
                    optimizationToLayers: [
                        {
                            target: 'store-architecture',
                            optimizations: ['Selective subscriptions', 'Batch updates', 'Memoized selectors']
                        },
                        {
                            target: 'components',
                            optimizations: ['React.memo', 'useCallback', 'useMemo', 'Virtualization']
                        },
                        {
                            target: 'api',
                            optimizations: ['Predictive preloading', 'Cache-first strategy', 'Concurrency limiting']
                        },
                        {
                            target: 'audio-engine',
                            optimizations: ['AudioWorklet fallback', 'Buffer prioritization']
                        }
                    ],
                    performanceGate: [
                        {
                            threshold: '10ms per store operation',
                            action: 'Log warning if exceeded',
                            file: 'src/utils/performanceBaseline.ts'
                        },
                        {
                            threshold: '5% regression detection',
                            action: 'Flag for review',
                            file: 'src/utils/performanceBaseline.ts'
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

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
    'get_preloading_patterns',
    'Get preloading and resource optimization patterns for images, routes, and components',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    components: [
                        {
                            name: 'ImagePreloader',
                            file: 'src/utils/imagePreloader.ts',
                            purpose: 'Smart image preloading with concurrency control',
                            features: [
                                'Queue-based concurrency limiting (MAX_CONCURRENT = 6)',
                                'Priority support (high/low) for critical images',
                                'Service Worker cache integration',
                                'Request deduplication via cache status map'
                            ],
                            usage: `imageLoader.lazyImage(elem, url);
imageLoader.setLazyImage(element, url, true); // true = priority`
                        },
                        {
                            name: 'PredictivePreloader',
                            file: 'src/utils/predictivePreloader.ts',
                            purpose: 'Predictive route and component preloading',
                            features: [
                                'User behavior pattern tracking',
                                'Rate limiting (MIN_PRELOAD_INTERVAL = 2000ms)',
                                'Concurrent preloading limit (MAX_CONCURRENT = 3)',
                                'Preload queue management to avoid duplicates'
                            ],
                            usage: `predictivePreloader.preload('/music', userContext);`
                        },
                        {
                            name: 'PreloadPerformanceMonitor',
                            file: 'src/utils/preloadPerformanceMonitor.ts',
                            purpose: 'Track preload metrics and hit rates',
                            metrics: [
                                'preloadTime - Time to preload resource',
                                'accessTime - Time to first user access',
                                'timeToInteractive - Total preload + access time',
                                'preloadHitRate - Percentage of preloads actually used'
                            ]
                        },
                        {
                            name: 'imageLoader (lazyImage)',
                            file: 'src/components/images/imageLoader.js',
                            purpose: 'Lazy image loading with fetchpriority support',
                            features: [
                                'Intersection Observer-based lazy loading',
                                'Blurhash placeholder support',
                                'fetchpriority="high" for above-fold images',
                                'Fade-in animations for smooth UX'
                            ],
                            usage: `imageLoader.lazyImage(elem, url);
imageLoader.setLazyImage(element, url, true); // true = high priority`
                        }
                    ],
                    patterns: [
                        {
                            name: 'Semaphore-based Concurrency',
                            purpose: 'Limit concurrent requests to prevent network congestion',
                            implementation: 'private readonly MAX_CONCURRENT = 6;\nprivate readonly activeRequests = new Set<string>();\nprivate readonly requestQueue: Array<{url: string; resolve: (status: string) => void}> = [];\n\nprivate tryProcessQueue() {\n    while (this.requestQueue.length > 0 && this.activeRequests.size < this.MAX_CONCURRENT) {\n        const next = this.requestQueue.shift();\n        if (next) this.processImage(next.url).then(next.resolve);\n    }\n}',
                            when: 'Preloading multiple images, routes, or components'
                        },
                        {
                            name: 'Rate Limiting with Timestamps',
                            purpose: 'Prevent over-eager preloading on rapid navigation',
                            implementation: 'private readonly MIN_PRELOAD_INTERVAL = 2000;\nprivate lastPreloadTime = 0;\n\nprivate canPreload() {\n    const now = Date.now();\n    return now - this.lastPreloadTime >= this.MIN_PRELOAD_INTERVAL;\n}',
                            when: 'Predictive preloading on navigation events'
                        },
                        {
                            name: 'Preload Link Management',
                            purpose: 'Prevent DOM memory leaks from preload links',
                            implementation: 'const MAX_PRELOAD_LINKS = 10;\nconst PRELOAD_LINK_PREFIX = "pwa-preload-";\n\nfunction createPreloadLink(id: string, url: string) {\n    cleanupOldPreloadLinks();\n    const existingLink = document.getElementById(`${PRELOAD_LINK_PREFIX}${id}`);\n    if (existingLink) existingLink.remove();\n    const link = document.createElement("link");\n    link.rel = "preload";\n    link.as = "image";\n    link.href = url;\n    link.id = `${PRELOAD_LINK_PREFIX}${id}`;\n    document.head.appendChild(link);\n}',
                            when: 'Preloading images in item details pages'
                        },
                        {
                            name: 'Fetch Priority Hints',
                            purpose: 'Ensure critical images load before below-fold content',
                            implementation: '// On Image element\n<img src="..." fetchpriority="high" />\n\n// In JavaScript\nconst img = new Image();\nimg.src = url;\nimg.fetchPriority = "high";',
                            when: 'Above-fold hero images, logos, critical UI elements'
                        }
                    ],
                    antiPatterns: [
                        {
                            issue: 'Unbounded Promise.allSettled for preloading',
                            problem: 'Creates unlimited concurrent requests, may saturate network',
                            fix: 'Use semaphore-based queue with MAX_CONCURRENT limit'
                        },
                        {
                            issue: 'Preload links never removed',
                            problem: 'Memory leak as each navigation adds new <link> elements',
                            fix: 'Track with IDs, remove when replaced or at max limit'
                        },
                        {
                            issue: 'Queue cleared before checking isPreloaded',
                            problem: 'isPreloaded() always returns false',
                            fix: 'Add to queue AFTER preload completes, not before'
                        },
                        {
                            issue: 'No rate limiting on navigation',
                            problem: 'Predictive preloading fires on every route change',
                            fix: 'Enforce MIN_PRELOAD_INTERVAL between preloads'
                        }
                    ],
                    metrics: {
                        preloadConcurrency: { default: 3, max: 6, perType: { routes: 3, images: 6, components: 2 } },
                        preloadIntervalMs: 2000,
                        maxPreloadLinks: 10,
                        queueBatchSize: 5
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

createTool(
    'get_react_performance',
    'Understand React performance optimization patterns',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    optimizationTechniques: [
                        {
                            technique: 'React.memo',
                            purpose: 'Prevent unnecessary re-renders for pure components',
                            example: 'const NowPlayingBar = React.memo(function NowPlayingBarImpl() {...});'
                        },
                        {
                            technique: 'useCallback',
                            purpose: 'Memoize callback functions',
                            example: 'const handlePlay = useCallback(() => play(), [play]);'
                        },
                        {
                            technique: 'useMemo',
                            purpose: 'Memoize expensive computations',
                            example: 'const filteredItems = useMemo(() => items.filter(filter), [items, filter]);'
                        },
                        {
                            technique: 'Virtualization',
                            purpose: 'Render only visible items in long lists',
                            libraries: ['@tanstack/react-virtual', 'react-window']
                        }
                    ],
                    commonIssues: [
                        {
                            issue: 'Component re-renders on every store change',
                            cause: 'Subscribing to entire store state',
                            fix: 'Use selective selectors: useStore(s => s.specificValue)'
                        },
                        {
                            issue: 'Callback references change on every render',
                            cause: 'Defining functions inline in component',
                            fix: 'Wrap in useCallback with proper dependencies'
                        },
                        {
                            issue: 'Expensive computation runs on every render',
                            cause: 'No memoization of derived data',
                            fix: 'Wrap in useMemo with proper dependencies'
                        }
                    ],
                    performanceTools: [
                        {
                            name: 'React DevTools Profiler',
                            purpose: 'Visualize render phases and identify bottlenecks'
                        },
                        {
                            name: 'why-did-you-render',
                            purpose: 'Log why components re-render'
                        },
                        {
                            name: 'Chrome Performance Tab',
                            purpose: 'Timeline analysis of JS execution'
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_bundle_optimization',
    'Understand bundle size optimization patterns',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    analysisTools: [
                        {
                            name: 'rollup-plugin-visualizer',
                            purpose: 'Visualize bundle contents and dependencies'
                        },
                        {
                            name: 'source-map-explorer',
                            purpose: 'Analyze bundle size by source files'
                        },
                        {
                            name: 'esbuild',
                            purpose: 'Fast bundling with tree-shaking'
                        }
                    ],
                    optimizationTechniques: [
                        {
                            technique: 'Code Splitting',
                            description: 'Split code into separate chunks loaded on demand',
                            implementation: 'React.lazy(() => import("./Component"))',
                            benefit: 'Reduced initial bundle size'
                        },
                        {
                            technique: 'Tree Shaking',
                            description: 'Remove unused exports from bundles',
                            implementation: 'ES modules with sideEffects: false',
                            benefit: 'Smaller production bundles'
                        },
                        {
                            technique: 'Dynamic Imports',
                            description: 'Load code only when needed',
                            implementation: 'import("./utils").then(module => module.func())',
                            benefit: 'Lazy loading of utilities'
                        }
                    ],
                    jellyfinOptimizations: [
                        {
                            area: 'Route Splitting',
                            file: 'src/apps/stable/routes/lazyRoutes/',
                            pattern: 'Lazy load route components',
                            benefit: 'Faster initial page load'
                        },
                        {
                            area: 'Component Splitting',
                            file: 'src/components/',
                            pattern: 'Dynamic import for heavy components',
                            benefit: 'Reduced main bundle size'
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_caching_strategies',
    'Understand caching strategies for optimal performance',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    cachingLayers: [
                        {
                            layer: 'Browser Cache',
                            storage: 'Cache-Control headers',
                            duration: 'Configurable per resource type',
                            useCase: 'Static assets, API responses'
                        },
                        {
                            layer: 'Service Worker Cache',
                            storage: 'Workbox runtime caching',
                            strategies: ['CacheFirst', 'NetworkFirst', 'StaleWhileRevalidate'],
                            useCase: 'Offline support, asset caching'
                        },
                        {
                            layer: 'In-Memory Cache',
                            storage: 'JavaScript objects/maps',
                            duration: 'Session lifetime',
                            useCase: 'Computed values, API response caching'
                        },
                        {
                            layer: 'IndexedDB',
                            storage: 'Persistent browser database',
                            duration: 'Permanent until cleared',
                            useCase: 'Large data, user preferences'
                        }
                    ],
                    jellyfinCaching: [
                        {
                            name: 'Image Cache',
                            location: 'Service Worker',
                            strategy: 'CacheFirst',
                            duration: '30 days',
                            files: '*.jpg, *.png, *.webp'
                        },
                        {
                            name: 'Audio Cache',
                            location: 'Service Worker',
                            strategy: 'NetworkFirst',
                            duration: '7 days',
                            files: '*.mp3, *.flac, *.ogg'
                        },
                        {
                            name: 'Peak Data Cache',
                            location: 'In-Memory (LRU)',
                            strategy: 'Manual',
                            limit: '10 items',
                            files: 'Waveform peak data'
                        }
                    ],
                    cacheInvalidation: [
                        'Version-based (cache-busting query params)',
                        'Time-based (max-age headers)',
                        'Content-based (ETags)',
                        'Manual (clear on update)'
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
                text: `# Jellyfin Performance Monitoring & Preloading

## Overview
Performance monitoring system for tracking store operation execution times and detecting regressions, plus preloading patterns for images, routes, and components.

## Performance Monitoring Architecture
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

## Preloading Architecture
\`\`\`
┌─────────────────────────────┐     ┌─────────────────────────────┐
│  PredictivePreloader        │────▶│  Route/Component Imports    │
│  - Pattern prediction       │     │  - Lazy route loading       │
│  - Rate limiting            │     │  - Dynamic imports          │
└─────────────┬───────────────┘     └─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐     ┌─────────────────────────────┐
│  ImagePreloader             │────▶│  Service Worker Cache       │
│  - Concurrency limiting     │     │  - CacheFirst strategy      │
│  - Priority queue           │     │  - Image caching (30 days)  │
└─────────────────────────────┘     └─────────────────────────────┘
\`\`\`

## Usage

### Performance Monitoring

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

### Image Preloading

\`\`\`typescript
import { imagePreloader } from 'utils/imagePreloader';

// High priority (hero image, logo)
await imagePreloader.preloadImage(url, 'high');

// Batch preload for queue (limited to 6 concurrent)
await imagePreloader.preloadQueueImages(queueItems);
\`\`\`

### Lazy Image with Priority
\`\`\`typescript
import imageLoader from 'components/images/imageLoader.js';

// Normal lazy loading
imageLoader.lazyImage(element, url);

// High priority for above-fold images
imageLoader.setLazyImage(element, url, true);
\`\`\`

### Predictive Preloading
\`\`\`typescript
import { predictivePreloader } from 'utils/predictivePreloader';

// Called on navigation
predictivePreloader.preload('/music', { lastPlayedType: 'Audio' });
\`\`\`

## Key Metrics

### Store Operations
| Metric | Description | Good | Warning |
|--------|-------------|------|---------|
| averageMs | Mean execution time | < 5ms | > 10ms |
| percentile95 | 95th percentile | < 10ms | > 20ms |
| standardDeviation | Variability | < 2ms | > 5ms |
| violations | Operations over threshold | 0 | > 0 |

### Preloading
| Metric | Description | Good | Warning |
|--------|-------------|------|---------|
| preloadTime | Time to preload resource | < 100ms | > 500ms |
| preloadHitRate | % of preloads used | > 50% | < 20% |
| activePreloads | Concurrent requests | 1-3 | > 6 |

## Concurrency Limits
| Resource Type | Max Concurrent | Purpose |
|---------------|----------------|---------|
| Images | 6 | Prevent network saturation |
| Routes | 3 | Limit bundle loading |
| Components | 2 | Control code splitting |

## Rate Limiting
- **Min interval between preloads**: 2000ms
- **Prevents**: Over-eager preloading on rapid navigation
- **Applies to**: PredictivePreloader

## Memory Management
- **Max preload links in DOM**: 10
- **Preload link prefix**: \`pwa-preload-\`
- **Strategy**: Remove oldest when limit exceeded

## Files
- \`src/utils/performanceBaseline.ts\` - Performance monitoring
- \`src/utils/imagePreloader.ts\` - Image preloading
- \`src/utils/predictivePreloader.ts\` - Route/component preloading
- \`src/utils/preloadPerformanceMonitor.ts\` - Preload metrics
- \`src/components/images/imageLoader.js\` - Lazy image loading
`
            }]
        };
    }
);

const transport = new StdioServerTransport();
await server.connect(transport);
