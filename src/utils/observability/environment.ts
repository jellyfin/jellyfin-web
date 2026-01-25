import { EnvironmentContext } from './types';

/**
 * Environment utilities for consistent context
 */

// Cache expensive lookups
let cachedEnvironment: Partial<EnvironmentContext> | null = null;
let sessionId: string | null = null;

/**
 * Generate unique session ID on first load
 */
function generateSessionId(): string {
    if (typeof window === 'undefined') {
        return 'server-session';
    }

    // Check for existing session ID
    let existingId = sessionStorage.getItem('jellyfin-session-id');
    if (existingId) {
        return existingId;
    }

    // Generate new session ID
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('jellyfin-session-id', newId);
    return newId;
}

/**
 * Get current session ID
 */
export function getSessionId(): string {
    if (!sessionId) {
        sessionId = generateSessionId();
    }
    return sessionId;
}

/**
 * Get build hash from Vite or package.json
 */
export function getBuildHash(): string | undefined {
    // Vite provides this during build
    try {
        if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BUILD_HASH) {
            return (import.meta as any).env.VITE_BUILD_HASH;
        }
    } catch {
        // Fallback to other methods
    }

    // Fallback to git hash if available
    if (typeof window !== 'undefined' && (window as any).__BUILD_HASH__) {
        return (window as any).__BUILD_HASH__;
    }

    return undefined;
}

/**
 * Get app version from package.json
 */
export function getAppVersion(): string | undefined {
    try {
        if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_APP_VERSION) {
            return (import.meta as any).env.VITE_APP_VERSION;
        }
    } catch {
        // Fallback to other methods
    }

    if (typeof window !== 'undefined' && (window as any).__APP_VERSION__) {
        return (window as any).__APP_VERSION__;
    }

    return undefined;
}

/**
 * Get user agent string
 */
export function getUserAgent(): string | undefined {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return navigator.userAgent;
}

/**
 * Get current page URL
 */
export function getCurrentUrl(): string | undefined {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return window.location.href;
}

/**
 * Get environment context with caching
 */
export function getEnvironmentContext(): EnvironmentContext {
    if (cachedEnvironment) {
        return { ...cachedEnvironment, timestamp: new Date().toISOString() };
    }

    cachedEnvironment = {
        buildHash: getBuildHash(),
        version: getAppVersion(),
        userAgent: getUserAgent(),
        url: getCurrentUrl()
        // timestamp will be added dynamically
    };

    return { ...cachedEnvironment, timestamp: new Date().toISOString() };
}

/**
 * Get user ID from auth store
 */
export function getCurrentUserId(): string | undefined {
    try {
        // Import dynamically to avoid circular dependencies
        const { useAuthStore } = require('../../store/authStore');
        return useAuthStore.getState().userId;
    } catch {
        return undefined;
    }
}

/**
 * Get server ID from server store
 */
export function getCurrentServerId(): string | undefined {
    try {
        const { useServerStore } = require('../../store/serverStore');
        return useServerStore.getState().currentServer?.id;
    } catch {
        return undefined;
    }
}

/**
 * Generate unique event ID
 */
export function generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clear cached environment (useful for testing)
 */
export function clearEnvironmentCache(): void {
    cachedEnvironment = null;
}

/**
 * Initialize environment context (call once on app start)
 */
export function initializeEnvironment(): void {
    // Pre-warm the cache
    getEnvironmentContext();

    // Generate session ID if not exists
    getSessionId();
}
