import { logger } from './logger';

declare global {
    interface Navigator {
        connection?: {
            effectiveType: string;
            downlink: number;
            rtt: number;
        };
        getInstalledRelatedApps?: () => Promise<any[]>;
    }
}

class PerformanceMonitor {
    static init() {
        this.measureCLS();
        this.measureFID();
        this.measureLCP();
        this.measureTTFB();
        this.measurePWAMetrics();
        this.measureBundleLoad();
        this.measureServiceWorker();
        this.reportMetrics();
    }

    static measureCLS() {
        let clsValue = 0;

        try {
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries() as any[]) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }

                logger.debug('CLS metric', { component: 'PerformanceMonitor', value: clsValue });
            }).observe({ type: 'layout-shift', buffered: true });
        } catch (e) {
            // Not supported
        }
    }

    static measureFID() {
        try {
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries() as any[]) {
                    const fid = entry.processingStart - entry.startTime;
                    logger.debug('FID metric', {
                        component: 'PerformanceMonitor',
                        value: fid,
                        unit: 'ms'
                    });
                }
            }).observe({ type: 'first-input', buffered: true });
        } catch (e) {
            // Not supported
        }
    }

    static measureLCP() {
        try {
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                logger.debug('LCP metric', {
                    component: 'PerformanceMonitor',
                    value: lastEntry.startTime,
                    unit: 'ms'
                });
            }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {
            // Not supported
        }
    }

    static measureTTFB() {
        try {
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries() as any[]) {
                    const ttfb = entry.responseStart - entry.requestStart;
                    logger.debug('TTFB metric', {
                        component: 'PerformanceMonitor',
                        value: ttfb,
                        unit: 'ms'
                    });
                }
            }).observe({ type: 'navigation', buffered: true });
        } catch (e) {
            // Not supported
        }
    }

    static measureBundleLoad() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const resources = performance.getEntriesByType(
                    'resource'
                ) as PerformanceResourceTiming[];
                const bundles = resources.filter(
                    (r) => r.name.includes('.js') && !r.name.includes('libraries/')
                );

                const bundleInfo = bundles.map((bundle) => ({
                    name: bundle.name,
                    duration: bundle.duration.toFixed(1)
                }));
                logger.debug('Bundle loads', {
                    component: 'PerformanceMonitor',
                    count: bundles.length,
                    bundles: bundleInfo
                });

                const totalBundleSize = bundles.reduce((sum, b) => sum + (b.transferSize || 0), 0);
                logger.info('Total bundle size', {
                    component: 'PerformanceMonitor',
                    sizeMB: (totalBundleSize / 1024 / 1024).toFixed(2)
                });
            }, 1000);
        });
    }

    static measurePWAMetrics() {
        if ('getInstalledRelatedApps' in navigator && navigator.getInstalledRelatedApps) {
            navigator.getInstalledRelatedApps().then((apps) => {
                logger.debug('Related apps installed', {
                    component: 'PerformanceMonitor',
                    count: apps.length
                });
            });
        }

        const displayMode = this.getDisplayMode();
        logger.debug('Display mode', { component: 'PerformanceMonitor', mode: displayMode });

        if ('connection' in navigator && navigator.connection) {
            const connection = navigator.connection;
            logger.debug('Connection info', {
                component: 'PerformanceMonitor',
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
            });
        }

        this.validateManifest();
    }

    static getDisplayMode() {
        if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
        if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
        if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
        return 'browser';
    }

    static validateManifest() {
        if ('manifest' in document.createElement('link')) {
            logger.debug('Web App Manifest supported', { component: 'PerformanceMonitor' });
        } else {
            logger.warn('Web App Manifest not supported', { component: 'PerformanceMonitor' });
        }
    }

    static measureServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                logger.debug('Service Worker ready', {
                    component: 'PerformanceMonitor',
                    state: registration.active?.state,
                    scope: registration.scope,
                    updateViaCache: registration.updateViaCache
                });

                if ((window as any).ServiceWorkerCacheManager) {
                    (window as any).ServiceWorkerCacheManager.getCacheStatus()
                        .then((status: any) => {
                            logger.debug('Cache status', {
                                component: 'PerformanceMonitor',
                                status
                            });
                        })
                        .catch((error: any) => {
                            logger.error('Cache status check failed', {
                                component: 'PerformanceMonitor',
                                error: error.message
                            });
                        });
                }
            });
        }
    }

    static reportMetrics() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType(
                    'navigation'
                )[0] as PerformanceNavigationTiming;
                if (!navigation) return;

                const paintEntries = performance.getEntriesByType('paint');
                const firstPaint =
                    paintEntries.find((p) => p.name === 'first-paint')?.startTime || 0;
                const firstContentfulPaint =
                    paintEntries.find((p) => p.name === 'first-contentful-paint')?.startTime || 0;

                const metrics = {
                    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                    domContentLoaded:
                        navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    firstPaint,
                    firstContentfulPaint
                };

                logger.info('Page metrics', { component: 'PerformanceMonitor', ...metrics });
            }, 2000);
        });
    }

    static sendToAnalytics(metrics: any) {
        if ((window as any).gtag) {
            (window as any).gtag('event', 'web_vitals', {
                event_category: 'Web Vitals',
                event_label: 'PWA',
                value: Math.round(metrics.loadTime)
            });
        }
    }
}

export default PerformanceMonitor;
