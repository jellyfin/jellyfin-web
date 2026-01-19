import logger from './logger';

class PWAAudit {
    static async runFullAudit() {
        const results = {};

        try {
            results.manifest = await this.auditManifest();
            results.serviceWorker = await this.auditServiceWorker();
            results.https = this.auditHTTPS();
            results.viewport = this.auditViewport();
            results.performance = await this.auditPerformance();
            results.offline = await this.auditOfflineCapability();
            results.installability = await this.auditInstallability();
            results.notifications = this.auditPushNotifications();
            results.backgroundSync = this.auditBackgroundSync();
            results.shortcuts = this.auditShortcuts();

            this.displayResults(results);
        } catch (error) {
            logger.error('PWA Audit failed', { component: 'PWAAudit', error: error.message });
        }
    }

    static async auditManifest() {
        const result = { score: 0, maxScore: 100, issues: [], recommendations: [] };

        try {
            const response = await fetch('/manifest.json');
            const manifest = await response.json();

            const required = ['name', 'short_name', 'start_url', 'display', 'icons'];
            required.forEach(field => {
                if (manifest[field]) {
                    result.score += 10;
                } else {
                    result.issues.push(`Missing required field: ${field}`);
                }
            });

            if (manifest.theme_color) result.score += 5;
            if (manifest.background_color) result.score += 5;
            if (manifest.description) result.score += 5;
            if (manifest.lang) result.score += 5;
            if (manifest.orientation) result.score += 5;

            if (manifest.shortcuts) {
                result.score += 10;
                result.recommendations.push('App shortcuts configured');
            } else {
                result.recommendations.push('Consider adding app shortcuts');
            }

            if (manifest.categories && manifest.categories.length > 0) {
                result.score += 5;
            }

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
                        result.recommendations.push('Service worker active');
                    }

                    if (registration.scope) {
                        result.score += 10;
                    }

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
            result.recommendations.push('HTTPS enabled');
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
                result.recommendations.push('Proper viewport configured');
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

        if ('PerformanceObserver' in window) {
            result.score += 10;

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

        const criticalCSS = document.querySelector('style');
        if (criticalCSS && criticalCSS.textContent.length > 100) {
            result.score += 10;
            result.recommendations.push('Critical CSS inlined');
        }

        return result;
    }

    static async auditOfflineCapability() {
        const result = { score: 0, maxScore: 40, issues: [], recommendations: [] };

        try {
            const offlineResponse = await fetch('/offline.html', { method: 'HEAD' });
            if (offlineResponse.ok) {
                result.score += 15;
                result.recommendations.push('Offline page available');
            }

            if (window.ServiceWorkerCacheManager) {
                const cacheStatus = await window.ServiceWorkerCacheManager.getCacheStatus();
                if (cacheStatus.cacheInfo) {
                    result.score += 15;

                    const totalEntries = Object.values(cacheStatus.cacheInfo)
                        .reduce((sum, cache) => sum + (cache.entries || 0), 0);

                    if (totalEntries > 0) {
                        result.score += 10;
                        result.recommendations.push(`${totalEntries} items cached`);
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

        if ('onbeforeinstallprompt' in window) {
            result.score += 10;
        }

        if (window.matchMedia('(display-mode: standalone)').matches) {
            result.score += 20;
            result.recommendations.push('App running in standalone mode');
        } else {
            result.recommendations.push('App not yet installed');
        }

        return result;
    }

    static auditPushNotifications() {
        const result = { score: 0, maxScore: 20, issues: [], recommendations: [] };

        if ('Notification' in window) {
            result.score += 10;

            if (Notification.permission === 'granted') {
                result.score += 10;
                result.recommendations.push('Push notifications enabled');
            } else {
                result.recommendations.push('Push notifications not enabled');
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
            result.recommendations.push('Background sync supported');
        } else {
            result.recommendations.push('Background sync not supported');
        }

        return result;
    }

    static auditShortcuts() {
        const result = { score: 0, maxScore: 15, issues: [], recommendations: [] };

        if (window.matchMedia('(display-mode: standalone)').matches) {
            result.score += 15;
            result.recommendations.push('App shortcuts available');
        } else {
            result.recommendations.push('Install app to access shortcuts');
        }

        return result;
    }

    static displayResults(results) {
        const summary = Object.entries(results).map(([category, data]) => ({
            category: category.charAt(0).toUpperCase() + category.slice(1),
            score: `${data.score}/${data.maxScore}`,
            percentage: `${Math.round((data.score / data.maxScore) * 100)}%`,
            issues: data.issues.length,
            recommendations: data.recommendations.length
        }));

        logger.info('PWA Audit Summary', { component: 'PWAAudit', summary });

        const totalScore = Object.values(results).reduce((sum, cat) => sum + cat.score, 0);
        const totalMax = Object.values(results).reduce((sum, cat) => sum + cat.maxScore, 0);
        const overallPercentage = Math.round((totalScore / totalMax) * 100);

        logger.info(`Overall PWA Score: ${totalScore}/${totalMax} (${overallPercentage}%)`, { component: 'PWAAudit' });

        Object.entries(results).forEach(([category, data]) => {
            if (data.issues.length > 0) {
                logger.warn(`${category} Issues`, { component: 'PWAAudit', issues: data.issues });
            }
            if (data.recommendations.length > 0) {
                logger.info(`${category} Recommendations`, { component: 'PWAAudit', recommendations: data.recommendations });
            }
        });

        const grade = this.getGrade(overallPercentage);
        logger.info(`PWA Grade: ${grade}`, { component: 'PWAAudit' });

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

// PWA Audit disabled
// export default PWAAudit;
