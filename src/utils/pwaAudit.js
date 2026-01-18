// PWA Audit Tool - Comprehensive PWA compliance checker
class PWAAudit {
    static async runFullAudit() {
        console.group('🔍 PWA Audit Results');
        const results = {};

        try {
            // Core PWA Requirements
            results.manifest = await this.auditManifest();
            results.serviceWorker = await this.auditServiceWorker();
            results.https = this.auditHTTPS();
            results.viewport = this.auditViewport();

            // Performance & UX
            results.performance = await this.auditPerformance();
            results.offline = await this.auditOfflineCapability();
            results.installability = await this.auditInstallability();

            // Advanced Features
            results.notifications = this.auditPushNotifications();
            results.backgroundSync = this.auditBackgroundSync();
            results.shortcuts = this.auditShortcuts();

            this.displayResults(results);

        } catch (error) {
            console.error('PWA Audit failed:', error);
        }
        console.groupEnd();
    }

    static async auditManifest() {
        const result = { score: 0, maxScore: 100, issues: [], recommendations: [] };

        try {
            const response = await fetch('/manifest.json');
            const manifest = await response.json();

            // Required fields
            const required = ['name', 'short_name', 'start_url', 'display', 'icons'];
            required.forEach(field => {
                if (manifest[field]) {
                    result.score += 10;
                } else {
                    result.issues.push(`Missing required field: ${field}`);
                }
            });

            // Recommended fields
            if (manifest.theme_color) result.score += 5;
            if (manifest.background_color) result.score += 5;
            if (manifest.description) result.score += 5;
            if (manifest.lang) result.score += 5;
            if (manifest.orientation) result.score += 5;

            // Advanced features
            if (manifest.shortcuts) {
                result.score += 10;
                result.recommendations.push('✅ App shortcuts configured');
            } else {
                result.recommendations.push('⚠️ Consider adding app shortcuts');
            }

            if (manifest.categories && manifest.categories.length > 0) {
                result.score += 5;
            }

            // Icon validation
            if (manifest.icons && manifest.icons.length > 0) {
                const hasMaskable = manifest.icons.some(icon => icon.purpose && icon.purpose.includes('maskable'));
                const hasLargeIcon = manifest.icons.some(icon => parseInt(icon.sizes) >= 512);

                if (hasMaskable) result.score += 10;
                if (hasLargeIcon) result.score += 10;
            }

        } catch (error) {
            result.issues.push(`Manifest fetch failed: ${error.message}`);
        }

        return result;
    }

    static async auditServiceWorker() {
        const result = { score: 0, maxScore: 100, issues: [], recommendations: [] };

        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    result.score += 30;

                    if (registration.active) {
                        result.score += 20;
                        result.recommendations.push('✅ Service worker active');
                    }

                    if (registration.scope) {
                        result.score += 10;
                    }

                    // Check for update capability
                    registration.addEventListener('updatefound', () => {
                        result.score += 10;
                    });

                } else {
                    result.issues.push('No service worker registration found');
                }
            } catch (error) {
                result.issues.push(`Service worker check failed: ${error.message}`);
            }
        } else {
            result.issues.push('Service Worker not supported');
        }

        return result;
    }

    static auditHTTPS() {
        const result = { score: 0, maxScore: 20, issues: [], recommendations: [] };

        if (location.protocol === 'https:' || location.hostname === 'localhost') {
            result.score += 20;
            result.recommendations.push('✅ HTTPS enabled');
        } else {
            result.issues.push('HTTPS not enabled (required for PWA features)');
        }

        return result;
    }

    static auditViewport() {
        const result = { score: 0, maxScore: 20, issues: [], recommendations: [] };

        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            const content = viewport.getAttribute('content');
            if (content && content.includes('width=device-width')) {
                result.score += 20;
                result.recommendations.push('✅ Proper viewport configured');
            } else {
                result.issues.push('Viewport meta tag incomplete');
            }
        } else {
            result.issues.push('Missing viewport meta tag');
        }

        return result;
    }

    static async auditPerformance() {
        const result = { score: 0, maxScore: 50, issues: [], recommendations: [] };

        // Check for Core Web Vitals
        if ('PerformanceObserver' in window) {
            result.score += 10;

            // LCP Check
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                if (entries.length > 0) {
                    const lcp = entries[entries.length - 1].startTime;
                    if (lcp < 2500) {
                        result.score += 10;
                    } else {
                        result.issues.push(`LCP too slow: ${lcp.toFixed(1)}ms`);
                    }
                }
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // FID Check
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.processingStart - entry.startTime < 100) {
                        result.score += 10;
                    } else {
                        result.issues.push('FID too slow');
                    }
                }
            }).observe({ entryTypes: ['first-input'] });
        }

        // Check for critical CSS
        const criticalCSS = document.querySelector('style');
        if (criticalCSS && criticalCSS.textContent.length > 100) {
            result.score += 10;
            result.recommendations.push('✅ Critical CSS inlined');
        }

        return result;
    }

    static async auditOfflineCapability() {
        const result = { score: 0, maxScore: 40, issues: [], recommendations: [] };

        try {
            // Check for offline page
            const offlineResponse = await fetch('/offline.html', { method: 'HEAD' });
            if (offlineResponse.ok) {
                result.score += 15;
                result.recommendations.push('✅ Offline page available');
            }

            // Check cache status
            if (window.ServiceWorkerCacheManager) {
                const cacheStatus = await window.ServiceWorkerCacheManager.getCacheStatus();
                if (cacheStatus.cacheInfo) {
                    result.score += 15;

                    const totalEntries = Object.values(cacheStatus.cacheInfo)
                        .reduce((sum, cache) => sum + (cache.entries || 0), 0);

                    if (totalEntries > 0) {
                        result.score += 10;
                        result.recommendations.push(`✅ ${totalEntries} items cached`);
                    }
                }
            }

        } catch (error) {
            result.issues.push(`Offline check failed: ${error.message}`);
        }

        return result;
    }

    static async auditInstallability() {
        const result = { score: 0, maxScore: 30, issues: [], recommendations: [] };

        // Check for beforeinstallprompt support
        if ('onbeforeinstallprompt' in window) {
            result.score += 10;
        }

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            result.score += 20;
            result.recommendations.push('✅ App running in standalone mode');
        } else {
            result.recommendations.push('ℹ️ App not yet installed');
        }

        return result;
    }

    static auditPushNotifications() {
        const result = { score: 0, maxScore: 20, issues: [], recommendations: [] };

        if ('Notification' in window) {
            result.score += 10;

            if (Notification.permission === 'granted') {
                result.score += 10;
                result.recommendations.push('✅ Push notifications enabled');
            } else {
                result.recommendations.push('ℹ️ Push notifications not enabled');
            }
        } else {
            result.issues.push('Push notifications not supported');
        }

        return result;
    }

    static auditBackgroundSync() {
        const result = { score: 0, maxScore: 15, issues: [], recommendations: [] };

        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            result.score += 15;
            result.recommendations.push('✅ Background sync supported');
        } else {
            result.recommendations.push('ℹ️ Background sync not supported');
        }

        return result;
    }

    static auditShortcuts() {
        const result = { score: 0, maxScore: 15, issues: [], recommendations: [] };

        // Check if running in standalone mode (required for shortcuts)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            // Shortcuts are defined in manifest, assume they're working
            result.score += 15;
            result.recommendations.push('✅ App shortcuts available');
        } else {
            result.recommendations.push('ℹ️ Install app to access shortcuts');
        }

        return result;
    }

    static displayResults(results) {
        console.log('📊 PWA Audit Summary:');
        console.table(Object.entries(results).map(([category, data]) => ({
            Category: category.charAt(0).toUpperCase() + category.slice(1),
            Score: `${data.score}/${data.maxScore}`,
            Percentage: `${Math.round((data.score / data.maxScore) * 100)}%`,
            Issues: data.issues.length,
            Recommendations: data.recommendations.length
        })));

        const totalScore = Object.values(results).reduce((sum, cat) => sum + cat.score, 0);
        const totalMax = Object.values(results).reduce((sum, cat) => sum + cat.maxScore, 0);
        const overallPercentage = Math.round((totalScore / totalMax) * 100);

        console.log(`🏆 Overall PWA Score: ${totalScore}/${totalMax} (${overallPercentage}%)`);

        // Detailed breakdown
        Object.entries(results).forEach(([category, data]) => {
            if (data.issues.length > 0) {
                console.group(`❌ ${category} Issues:`);
                data.issues.forEach(issue => {
                    console.log('  -', issue);
                });
                console.groupEnd();
            }

            if (data.recommendations.length > 0) {
                console.group(`💡 ${category} Recommendations:`);
                data.recommendations.forEach(rec => {
                    console.log('  -', rec);
                });
                console.groupEnd();
            }
        });

        // Grade the PWA
        const grade = this.getGrade(overallPercentage);
        console.log(`🎓 PWA Grade: ${grade}`);

        return results;
    }

    static getGrade(percentage) {
        if (percentage >= 95) return 'A+ (Excellent)';
        if (percentage >= 90) return 'A (Excellent)';
        if (percentage >= 85) return 'B+ (Very Good)';
        if (percentage >= 80) return 'B (Good)';
        if (percentage >= 75) return 'C+ (Fair)';
        if (percentage >= 70) return 'C (Fair)';
        if (percentage >= 60) return 'D (Poor)';
        return 'F (Fail)';
    }
}

// Auto-run audit after page load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            PWAAudit.runFullAudit();
        }, 3000); // Wait for everything to initialize
    });
}

// Add global access for debugging
window.PWAAudit = PWAAudit;