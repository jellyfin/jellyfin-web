/**
 * Performance monitoring for predictive preloading
 * Tracks preload effectiveness and user experience metrics
 */

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

  /**
   * Setup performance observer to track navigation and resource loading
   */
  private setupPerformanceObserver() {
    if (typeof PerformanceObserver !== 'undefined') {
      // Track navigation timing
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.entryType === 'navigation') {
            this.trackRouteAccess(entry.name, entry.loadEventEnd);
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });

      // Track resource loading
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

  /**
   * Track when a route is accessed
   */
  trackRouteAccess(route: string, accessTime: number) {
    this.routeAccessTimes.set(route, accessTime);

    // Find corresponding preload metric
    const metric = this.metrics.find(m => m.route === route);
    if (metric) {
      metric.accessTime = accessTime;
      metric.timeToInteractive = accessTime - metric.preloadTime;
    }
  }

  /**
   * Track resource loading times
   */
  trackResourceLoad(resource: string, loadTime: number) {
    console.log(`📊 Resource loaded: ${resource} in ${loadTime}ms`);
  }

  /**
   * Record preload event
   */
  recordPreload(route: string, preloadTime: number) {
    const metric: PreloadMetrics = {
      route,
      preloadTime,
      wasPreloaded: true
    };

    this.metrics.push(metric);

    // Keep only last 50 metrics
    if (this.metrics.length > 50) {
      this.metrics.shift();
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const preloadedRoutes = this.metrics.filter(m => m.wasPreloaded);
    const accessedRoutes = this.metrics.filter(m => m.accessTime);

    const avgPreloadTime = preloadedRoutes.length > 0
      ? preloadedRoutes.reduce((sum, m) => sum + m.preloadTime, 0) / preloadedRoutes.length
      : 0;

    const avgTimeToInteractive = accessedRoutes.length > 0
      ? accessedRoutes.reduce((sum, m) => sum + (m.timeToInteractive || 0), 0) / accessedRoutes.length
      : 0;

    const hitRate = accessedRoutes.length > 0
      ? (accessedRoutes.filter(m => m.wasPreloaded).length / accessedRoutes.length) * 100
      : 0;

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

  /**
   * Log performance report
   */
  logPerformanceReport() {
    const stats = this.getStats();

    console.group('🚀 Predictive Preloading Performance Report');
    console.log(`📊 Total preloads attempted: ${stats.totalPreloads}`);
    console.log(`✅ Routes successfully preloaded: ${stats.preloadedRoutes}`);
    console.log(`🎯 Routes accessed after preload: ${stats.accessedRoutes}`);
    console.log(`⚡ Average preload time: ${stats.averagePreloadTime}ms`);
    console.log(`🎪 Average time to interactive: ${stats.averageTimeToInteractive}ms`);
    console.log(`🎯 Preload hit rate: ${stats.preloadHitRate}%`);
    console.log(`📈 Preloader queue size: ${stats.preloaderStats.queueSize}`);
    console.log(`🗂️  Navigation patterns: ${stats.preloaderStats.patternsCount}`);
    console.groupEnd();
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset() {
    this.metrics = [];
    this.routeAccessTimes.clear();
  }
}

// Export singleton instance
export const preloadPerformanceMonitor = PreloadPerformanceMonitor.getInstance();