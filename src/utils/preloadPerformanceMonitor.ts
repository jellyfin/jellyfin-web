import logger from './logger';
import { predictivePreloader } from './predictivePreloader';

interface PreloadMetrics {
    route: string;
    preloadTime: number;
    accessTime?: number;
    wasPreloaded: boolean;
    timeToInteractive?: number;
}

export class PreloadPerformanceMonitor {
    private static instance: PreloadPerformanceMonitor;
    private metrics: PreloadMetrics[] = [];
    private routeAccessTimes: Map<string, number> = new Map();

    private constructor() {
        this.setupPerformanceObserver();
    }

    static getInstance(): PreloadPerformanceMonitor {
        if (!PreloadPerformanceMonitor.instance) {
            PreloadPerformanceMonitor.instance = new PreloadPerformanceMonitor();
        }
        return PreloadPerformanceMonitor.instance;
    }

    private setupPerformanceObserver() {
        if (typeof PerformanceObserver !== 'undefined') {
            const navObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry: any) => {
                    if (entry.entryType === 'navigation') {
                        this.trackRouteAccess(entry.name, entry.loadEventEnd);
                    }
                });
            });
            navObserver.observe({ entryTypes: ['navigation'] });

            const resourceObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry: any) => {
                    if (entry.name.includes('lazyRoutes') || entry.name.includes('components')) {
                        this.trackResourceLoad(entry.name, entry.responseEnd - entry.requestStart);
                    }
                });
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
        }
    }

    trackRouteAccess(route: string, accessTime: number) {
        this.routeAccessTimes.set(route, accessTime);

        const metric = this.metrics.find(m => m.route === route);
        if (metric) {
            metric.accessTime = accessTime;
            metric.timeToInteractive = accessTime - metric.preloadTime;
        }
    }

    trackResourceLoad(resource: string, loadTime: number) {
        logger.debug('Resource loaded', { component: 'PreloadMonitor', resource, loadTimeMs: loadTime });
    }

    recordPreload(route: string, preloadTime: number) {
        const metric: PreloadMetrics = {
            route,
            preloadTime,
            wasPreloaded: true
        };

        this.metrics.push(metric);

        if (this.metrics.length > 50) {
            this.metrics.shift();
        }
    }

    getStats() {
        const preloadedRoutes = this.metrics.filter(m => m.wasPreloaded);
        const accessedRoutes = this.metrics.filter(m => m.accessTime);

        const avgPreloadTime = preloadedRoutes.length > 0 ?
            preloadedRoutes.reduce((sum, m) => sum + m.preloadTime, 0) / preloadedRoutes.length :
            0;

        const avgTimeToInteractive = accessedRoutes.length > 0 ?
            accessedRoutes.reduce((sum, m) => sum + (m.timeToInteractive || 0), 0) / accessedRoutes.length :
            0;

        const hitRate = accessedRoutes.length > 0 ?
            (accessedRoutes.filter(m => m.wasPreloaded).length / accessedRoutes.length) * 100 :
            0;

        return {
            totalPreloads: this.metrics.length,
            preloadedRoutes: preloadedRoutes.length,
            accessedRoutes: accessedRoutes.length,
            averagePreloadTime: Math.round(avgPreloadTime),
            averageTimeToInteractive: Math.round(avgTimeToInteractive),
            preloadHitRate: Math.round(hitRate),
            preloaderStats: predictivePreloader.getStats()
        };
    }

    logPerformanceReport() {
        const stats = this.getStats();
        logger.info('Predictive Preloading Performance Report', {
            component: 'PreloadMonitor',
            totalPreloads: stats.totalPreloads,
            preloadedRoutes: stats.preloadedRoutes,
            accessedRoutes: stats.accessedRoutes,
            averagePreloadTimeMs: stats.averagePreloadTime,
            averageTimeToInteractiveMs: stats.averageTimeToInteractive,
            preloadHitRate: stats.preloadHitRate,
            preloaderQueueSize: stats.preloaderStats.queueSize,
            navigationPatternsCount: stats.preloaderStats.patternsCount
        });
    }

    reset() {
        this.metrics = [];
        this.routeAccessTimes.clear();
    }
}

export const preloadPerformanceMonitor = PreloadPerformanceMonitor.getInstance();
