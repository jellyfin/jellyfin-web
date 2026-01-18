/**
 * React hook for predictive preloading
 * Integrates with the predictive preloader system
 */

import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { predictivePreloader } from '../utils/predictivePreloader';

interface UserContext {
    lastPlayedType?: string;
    preferredContentType?: string;
    timeOfDay?: string;
    deviceType?: string;
}

export const usePredictivePreloading = (userContext?: UserContext) => {
    const location = useLocation();

    // Preload on route change
    useEffect(() => {
        const preload = async () => {
            try {
                await predictivePreloader.preload(location.pathname, userContext);
            } catch (error) {
                console.warn('Predictive preloading failed:', error);
            }
        };

        // Small delay to avoid blocking initial render
        const timeoutId = setTimeout(preload, 100);
        return () => clearTimeout(timeoutId);
    }, [location.pathname, userContext]);

    // Manual preload trigger
    const preloadManually = useCallback(async (paths: string[], context?: any) => {
        try {
            // Preload specific paths
            await predictivePreloader.preloadRoutes(paths);

            // Update context if provided
            if (context) {
                await predictivePreloader.preload(location.pathname, { ...userContext, ...context });
            }
        } catch (error) {
            console.warn('Manual preloading failed:', error);
        }
    }, [location.pathname, userContext]);

    return {
        preloadManually,
        isPreloaded: (resource: string) => predictivePreloader.isPreloaded(resource),
        getStats: () => predictivePreloader.getStats()
    };
};

/**
 * Hook for mouse hover preloading
 * Preloads routes/components when user hovers over navigation elements
 */
export const useHoverPreloading = () => {
    const preloadOnHover = useCallback(async (resource: string, type: 'route' | 'component' = 'route') => {
        try {
            if (type === 'route') {
                await predictivePreloader.preloadRoutes([resource]);
            } else {
                await predictivePreloader.preloadComponents([resource]);
            }
        } catch (error) {
            console.warn(`Hover preloading failed for ${resource}:`, error);
        }
    }, []);

    return { preloadOnHover };
};

/**
 * Hook for intersection observer preloading
 * Preloads content when it comes into viewport
 */
export const useIntersectionPreloading = () => {
    const preloadOnVisible = useCallback(async (resource: string, type: 'route' | 'component' = 'route') => {
        try {
            if (type === 'route') {
                await predictivePreloader.preloadRoutes([resource]);
            } else {
                await predictivePreloader.preloadComponents([resource]);
            }
        } catch (error) {
            console.warn(`Intersection preloading failed for ${resource}:`, error);
        }
    }, []);

    return { preloadOnVisible };
};
