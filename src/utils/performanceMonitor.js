// Performance monitoring for PWA optimization
class PerformanceMonitor {
    static init() {
        // Core Web Vitals
        this.measureCLS();
        this.measureFID();
        this.measureLCP();
        this.measureTTFB();

        // PWA-specific metrics
        this.measurePWAMetrics();

        // Custom metrics
        this.measureBundleLoad();
        this.measureServiceWorker();

        // Report metrics
        this.reportMetrics();
    }

    static measureCLS() {
        let clsValue = 0;
        let clsEntries = [];

        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    clsEntries.push(entry);
                }
            }

            console.log('[Performance] CLS:', clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
    }

    static measureFID() {
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                console.log('[Performance] FID:', entry.processingStart - entry.startTime, 'ms');
            }
        }).observe({ entryTypes: ['first-input'] });
    }

    static measureLCP() {
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('[Performance] LCP:', lastEntry.startTime, 'ms');
        }).observe({ entryTypes: ['largest-contentful-paint'] });
    }

    static measureTTFB() {
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                console.log('[Performance] TTFB:', entry.responseStart - entry.requestStart, 'ms');
            }
        }).observe({ entryTypes: ['navigation'] });
    }

    static measureBundleLoad() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const resources = performance.getEntriesByType('resource');
                const bundles = resources.filter(r =>
                    r.name.includes('.js') && !r.name.includes('libraries/')
                );

                console.log('[Performance] Bundle loads:', bundles.length);
                bundles.forEach(bundle => {
                    console.log(`  ${bundle.name}: ${bundle.duration.toFixed(1)}ms`);
                });

                const totalBundleSize = bundles.reduce((sum, b) =>
                    sum + (b.transferSize || 0), 0
                );
                console.log('[Performance] Total bundle size:',
                    (totalBundleSize / 1024 / 1024).toFixed(2), 'MB'
                );
            }, 1000);
        });
    }

    static measurePWAMetrics() {
        // PWA install status
        if ('getInstalledRelatedApps' in navigator) {
            navigator.getInstalledRelatedApps().then((apps) => {
                console.log('[Performance] Related apps installed:', apps.length);
            });
        }

        // Display mode detection
        const displayMode = this.getDisplayMode();
        console.log('[Performance] Display mode:', displayMode);

        // Connection status
        if ('connection' in navigator) {
            const connection = navigator.connection;
            console.log('[Performance] Connection:', {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
            });
        }

        // Web App Manifest validation
        this.validateManifest();
    }

    static getDisplayMode() {
        if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
        if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
        if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
        return 'browser';
    }

    static validateManifest() {
        // Basic manifest validation
        if ('manifest' in document.createElement('link')) {
            console.log('[Performance] Web App Manifest supported');
        } else {
            console.warn('[Performance] Web App Manifest not supported');
        }
    }

    static measureServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                console.log('[Performance] Service Worker ready:', {
                    state: registration.active?.state,
                    scope: registration.scope,
                    updateViaCache: registration.updateViaCache
                });

                // Check cache status
                if (window.ServiceWorkerCacheManager) {
                    window.ServiceWorkerCacheManager.getCacheStatus().then((status) => {
                        console.log('[Performance] Cache status:', status);
                    }).catch(console.error);
                }
            });
        }
    }

    static reportMetrics() {
        // Send metrics to analytics if available
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const metrics = {
                    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    firstPaint: performance.getEntriesByType('paint')
                        .find(p => p.name === 'first-paint')?.startTime || 0,
                    firstContentfulPaint: performance.getEntriesByType('paint')
                        .find(p => p.name === 'first-contentful-paint')?.startTime || 0
                };

                console.log('[Performance] Page metrics:', metrics);

                // Could send to analytics service here
                // this.sendToAnalytics(metrics);
            }, 2000);
        });
    }

    static sendToAnalytics(metrics) {
        // Placeholder for analytics integration
        if (window.gtag) {
            window.gtag('event', 'web_vitals', {
                event_category: 'Web Vitals',
                event_label: 'PWA',
                value: Math.round(metrics.loadTime)
            });
        }
    }
}

// Initialize performance monitoring
PerformanceMonitor.init();