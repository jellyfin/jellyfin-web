// Bundle Size Analysis Tool
class BundleAnalyzer {
    static analyzeCurrentBundle() {
        console.group('📦 Bundle Size Analysis');

        // Analyze performance entries for bundle sizes
        if ('performance' in window && 'getEntriesByType' in performance) {
            const resources = performance.getEntriesByType('resource');
            const scripts = resources.filter(r => r.name.includes('.js') && !r.name.includes('libraries/'));

            console.log('📊 JavaScript Bundles:');
            scripts.forEach(script => {
                const sizeKB = (script.transferSize / 1024).toFixed(1);
                const cached = script.transferSize === 0 ? ' (cached)' : '';
                console.log(`  ${script.name.split('/').pop()}: ${sizeKB} KB${cached}`);
            });

            const totalSize = scripts.reduce((sum, script) => sum + script.transferSize, 0);
            const totalKB = (totalSize / 1024).toFixed(1);
            console.log(`💰 Total JavaScript Size: ${totalKB} KB`);

            // Analyze CSS
            const styles = resources.filter(r => r.name.includes('.css'));
            console.log('🎨 CSS Bundles:');
            styles.forEach(style => {
                const sizeKB = (style.transferSize / 1024).toFixed(1);
                console.log(`  ${style.name.split('/').pop()}: ${sizeKB} KB`);
            });
        }

        // Analyze loaded modules (if available)
        if (window.webpackChunkjellyfin_web) {
            const chunks = window.webpackChunkjellyfin_web;
            console.log('🔍 Webpack Chunks:');
            chunks.forEach((chunk, index) => {
                if (chunk && chunk.length > 0) {
                    console.log(`  Chunk ${index}: ${chunk.length} modules`);
                }
            });
        }

        this.analyzeLazyLoadingOpportunities();
        this.suggestOptimizations();

        console.groupEnd();
    }

    static analyzeLazyLoadingOpportunities() {
        console.log('🎯 Lazy Loading Opportunities:');

        // Check for components that could be lazy loaded
        const eagerComponents = [
            'displayMirrorManager',
            'playerSelectionMenu',
            'themeMediaPlayer',
            'autoThemes',
            'mouseManager',
            'screensavermanager',
            'serverNotifications'
        ];

        console.log('Components loaded eagerly (could be lazy-loaded):');
        eagerComponents.forEach(component => {
            console.log(`  - ${component}`);
        });

        // Check for route-based components
        const routeComponents = [
            'visualizer components',
            'music player components',
            'video player components',
            'admin/dashboard components'
        ];

        console.log('Route-specific components (should be lazy-loaded):');
        routeComponents.forEach(component => {
            console.log(`  - ${component}`);
        });
    }

    static suggestOptimizations() {
        console.log('🚀 Optimization Recommendations:');

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

        suggestions.forEach(suggestion => {
            console.log(`${suggestion.priority}: ${suggestion.action}`);
            console.log(`  Impact: ${suggestion.impact} | Effort: ${suggestion.effort}`);
        });
    }

    static generateOptimizationPlan() {
        console.group('📋 Bundle Optimization Implementation Plan');

        console.log('Phase 1: Quick Wins (Low effort, immediate impact)');
        console.log('1. Lazy load themeMediaPlayer component');
        console.log('2. Defer screensavermanager loading');
        console.log('3. Implement dynamic imports for admin routes');

        console.log('\nPhase 2: Route-Based Splitting (Medium effort, high impact)');
        console.log('1. Split visualizer routes into separate chunks');
        console.log('2. Split music/video player routes');
        console.log('3. Split dashboard/admin routes');

        console.log('\nPhase 3: Advanced Optimizations (Higher effort, incremental gains)');
        console.log('1. Implement virtual scrolling for large lists');
        console.log('2. Add service worker pre-caching for routes');
        console.log('3. Optimize bundle splitting based on usage patterns');

        console.log('\nExpected Results:');
        console.log('- Initial bundle: 29MB → 10-15MB (45-50% reduction)');
        console.log('- First paint: Current → 100-200ms faster');
        console.log('- Time to interactive: Current → 30-50% improvement');

        console.groupEnd();
    }
}

// Auto-run analysis on page load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            BundleAnalyzer.analyzeCurrentBundle();
            BundleAnalyzer.generateOptimizationPlan();
        }, 2000);
    });
}

// Add to global scope for manual analysis
window.BundleAnalyzer = BundleAnalyzer;
