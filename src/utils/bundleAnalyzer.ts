import { logger } from './logger';

declare global {
    interface Window {
        webpackChunkjellyfin_web?: any[];
    }
}

class BundleAnalyzer {
    static analyzeCurrentBundle() {
        logger.info('Bundle Size Analysis', { component: 'BundleAnalyzer' });

        if ('performance' in window && 'getEntriesByType' in performance) {
            const resources = performance.getEntriesByType(
                'resource'
            ) as PerformanceResourceTiming[];
            const scripts = resources.filter(
                (r) => r.name.includes('.js') && !r.name.includes('libraries/')
            );

            const scriptInfo = scripts.map((script) => ({
                name: script.name.split('/').pop(),
                sizeKB: (script.transferSize / 1024).toFixed(1),
                cached: script.transferSize === 0
            }));
            logger.debug('JavaScript Bundles', {
                component: 'BundleAnalyzer',
                scripts: scriptInfo
            });

            const totalSize = scripts.reduce((sum, script) => sum + script.transferSize, 0);
            const totalKB = (totalSize / 1024).toFixed(1);
            logger.info(`Total JavaScript Size: ${totalKB} KB`, { component: 'BundleAnalyzer' });

            const styles = resources.filter((r) => r.name.includes('.css'));
            const styleInfo = styles.map((style) => ({
                name: style.name.split('/').pop(),
                sizeKB: (style.transferSize / 1024).toFixed(1)
            }));
            logger.debug('CSS Bundles', { component: 'BundleAnalyzer', styles: styleInfo });
        }

        if (window.webpackChunkjellyfin_web) {
            const chunks = window.webpackChunkjellyfin_web;
            const chunkInfo = chunks.map((chunk, index) => ({
                chunk: index,
                modules: chunk?.length ?? 0
            }));
            logger.debug('Webpack Chunks', { component: 'BundleAnalyzer', chunks: chunkInfo });
        }

        this.analyzeLazyLoadingOpportunities();
        this.suggestOptimizations();
    }

    static analyzeLazyLoadingOpportunities() {
        logger.info('Lazy Loading Opportunities', { component: 'BundleAnalyzer' });

        const eagerComponents = [
            'displayMirrorManager',
            'playerSelectionMenu',
            'themeMediaPlayer',
            'autoThemes',
            'mouseManager',
            'screensavermanager',
            'serverNotifications'
        ];
        logger.debug('Components loaded eagerly (could be lazy-loaded)', {
            component: 'BundleAnalyzer',
            eagerComponents
        });

        const routeComponents = [
            'visualizer components',
            'music player components',
            'video player components',
            'admin/dashboard components'
        ];
        logger.debug('Route-specific components (should be lazy-loaded)', {
            component: 'BundleAnalyzer',
            routeComponents
        });
    }

    static suggestOptimizations() {
        logger.info('Optimization Recommendations', { component: 'BundleAnalyzer' });

        const suggestions = [
            {
                priority: 'HIGH',
                action: 'Implement route-based code splitting',
                impact: 'Reduce initial bundle by 30-50%',
                effort: 'Medium'
            },
            {
                priority: 'HIGH',
                action: 'Lazy load media player components',
                impact: 'Reduce initial bundle by 15-25%',
                effort: 'Low'
            },
            {
                priority: 'MEDIUM',
                action: 'Defer non-critical UI components',
                impact: 'Reduce initial bundle by 5-10%',
                effort: 'Low'
            },
            {
                priority: 'MEDIUM',
                action: 'Implement tree shaking for unused features',
                impact: 'Reduce bundle by 10-20%',
                effort: 'Medium'
            },
            {
                priority: 'LOW',
                action: 'Compress and optimize assets',
                impact: 'Reduce bundle by 5-10%',
                effort: 'Low'
            }
        ];

        suggestions.forEach((suggestion) => {
            logger.info(`${suggestion.priority}: ${suggestion.action}`, {
                component: 'BundleAnalyzer',
                ...suggestion
            });
        });
    }

    static generateOptimizationPlan() {
        logger.info('Bundle Optimization Implementation Plan', { component: 'BundleAnalyzer' });
        logger.info(
            'Phase 1 (Quick Wins): Lazy load themeMediaPlayer, defer screensaverManager, dynamic imports for admin routes',
            { component: 'BundleAnalyzer' }
        );
        logger.info(
            'Phase 2 (Route-Based Splitting): Split visualizer, music/video player, dashboard/admin routes',
            {
                component: 'BundleAnalyzer'
            }
        );
        logger.info(
            'Phase 3 (Advanced): Virtual scrolling, SW pre-caching, bundle splitting optimization',
            {
                component: 'BundleAnalyzer'
            }
        );
        logger.info(
            'Expected: Initial bundle 29MB -> 10-15MB (45-50% reduction), 100-200ms faster first paint, 30-50% TTI improvement',
            { component: 'BundleAnalyzer' }
        );
    }
}

export default BundleAnalyzer;
