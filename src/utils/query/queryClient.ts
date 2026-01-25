import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized TanStack Query client with optimized defaults
 *
 * Stale/Cache Strategy:
 * - staleTime: 30s - Data is fresh for 30s before refetch is considered
 * - gcTime: 5min - Unused data stays in cache for 5 minutes
 * - refetchOnWindowFocus: true - Refetch when user returns to tab (security benefit)
 * - refetchOnReconnect: true - Refetch when network reconnects
 *
 * Performance Optimizations:
 * - networkMode: 'always' - Support localhost development
 * - retry: 2 - Retry failed requests twice with exponential backoff
 * - structuralSharing: true - Minimize rerenders with referential equality
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            networkMode: 'always',
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 2,
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
            structuralSharing: true
        },
        mutations: {
            networkMode: 'always',
            retry: 1
        }
    }
});

// Query key factories for consistent cache keys
export const QueryKeys = {
    // User-related
    users: ['users'] as const,
    user: (id: string) => ['users', id] as const,
    currentUser: ['currentUser'] as const,

    // Library/Items
    items: (filters?: Record<string, unknown>) => ['items', filters] as const,
    item: (id: string) => ['items', id] as const,
    userViews: (userId?: string) => ['userViews', userId] as const,

    // Playback
    playbackInfo: (itemId: string) => ['playbackInfo', itemId] as const,
    mediaSource: (itemId: string) => ['mediaSource', itemId] as const,

    // Configuration
    configuration: ['configuration'] as const,
    namedConfiguration: (key: string) => ['configuration', key] as const,
    displayPreferences: (id: string) => ['displayPreferences', id] as const,

    // System
    systemInfo: ['systemInfo'] as const,
    serverLogs: ['serverLogs'] as const
} as const;
