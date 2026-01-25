/**
 * Random Sort Cache Utility
 * Caches randomized item orders for consistent library sorting.
 *
 * Key Features:
 * - Uses sessionStorage for cross-page consistency
 * - Preserves random order across pagination requests
 * - Handles storage quota gracefully
 * - 1-hour expiration to allow library updates
 */

import { logger } from './logger';

interface CachedRandomSort<T = unknown> {
    items: T[];
    timestamp: number;
    totalCount: number;
}

const CACHE_KEY_PREFIX = 'randomSortCache-';
const DEFAULT_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit to be safe

/**
 * Gets cached random items or fetches and caches them.
 * @param cacheKey Unique key for the cache (e.g., library ID + sort).
 * @param fetchAllItems Function to fetch all items.
 * @param expirationMs Cache expiration time in milliseconds.
 * @returns Promise resolving to all items in random order.
 */
export async function getCachedRandomItems<T = unknown>(
    cacheKey: string,
    fetchAllItems: () => Promise<T[]>,
    expirationMs: number = DEFAULT_EXPIRATION_MS
): Promise<T[]> {
    const fullKey = CACHE_KEY_PREFIX + cacheKey;
    const cached = loadFromCache(fullKey);

    if (cached && !isExpired(cached.timestamp, expirationMs)) {
        logger.debug(`[RandomSortCache] Using cached random order for ${cacheKey} (${cached.totalCount} items)`, {
            component: 'RandomSortCache'
        });
        return cached.items as T[];
    }

    logger.debug(`[RandomSortCache] Fetching and randomizing items for ${cacheKey}`, { component: 'RandomSortCache' });
    const items = await fetchAllItems();
    const randomized = shuffleArray(items);

    logger.debug(`[RandomSortCache] Randomized ${randomized.length} items for ${cacheKey}`, {
        component: 'RandomSortCache'
    });
    saveToCache(fullKey, { items: randomized, timestamp: Date.now(), totalCount: randomized.length });

    return randomized;
}

/**
 * Gets a paginated slice of cached random items.
 * @param cacheKey Unique key for the cache.
 * @param fetchAllItems Function to fetch all items.
 * @param startIndex Starting index for pagination.
 * @param limit Number of items to return.
 * @param expirationMs Cache expiration time.
 * @returns Promise resolving to paginated items.
 */
export async function getPaginatedRandomItems(
    cacheKey: string,
    fetchAllItems: () => Promise<any[]>,
    startIndex: number,
    limit: number,
    expirationMs: number = DEFAULT_EXPIRATION_MS
): Promise<any[]> {
    const allItems = await getCachedRandomItems(cacheKey, fetchAllItems, expirationMs);

    // Validate pagination parameters
    const safeStartIndex = Math.max(0, startIndex || 0);
    const safeLimit = Math.max(1, limit || 100);
    const endIndex = Math.min(safeStartIndex + safeLimit, allItems.length);

    const paginatedItems = allItems.slice(safeStartIndex, endIndex);

    logger.debug(
        `[RandomSortCache] Returning ${paginatedItems.length} items (${safeStartIndex}-${endIndex - 1}) from cache ${cacheKey}`,
        { component: 'RandomSortCache' }
    );

    return paginatedItems;
}

/**
 * Clears expired cache entries to free up storage space.
 * @param maxAgeMs Maximum age of cache entries to keep.
 */
export function cleanupExpiredCache(maxAgeMs: number = DEFAULT_EXPIRATION_MS): void {
    try {
        const keysToRemove: string[] = [];
        const now = Date.now();

        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(CACHE_KEY_PREFIX)) {
                try {
                    const data = JSON.parse(sessionStorage.getItem(key) || '{}');
                    if (data.timestamp && now - data.timestamp > maxAgeMs) {
                        keysToRemove.push(key);
                    }
                } catch {
                    // Invalid cache entry, remove it
                    keysToRemove.push(key);
                }
            }
        }

        keysToRemove.forEach(key => {
            sessionStorage.removeItem(key);
        });

        if (keysToRemove.length > 0) {
            logger.debug(`[RandomSortCache] Cleaned up ${keysToRemove.length} expired cache entries`, {
                component: 'RandomSortCache'
            });
        }
    } catch (error) {
        logger.warn('[RandomSortCache] Failed to cleanup cache', { component: 'RandomSortCache' }, error as Error);
    }
}

/**
 * Gets cache statistics for monitoring.
 * @returns Object with cache statistics.
 */
export function getCacheStats(): {
    totalEntries: number;
    totalSizeBytes: number;
    oldestEntry?: number;
    newestEntry?: number;
} {
    let totalEntries = 0;
    let totalSizeBytes = 0;
    let oldestEntry: number | undefined;
    let newestEntry: number | undefined;

    try {
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(CACHE_KEY_PREFIX)) {
                totalEntries++;
                const value = sessionStorage.getItem(key);
                if (value) {
                    totalSizeBytes += value.length;
                    try {
                        const data = JSON.parse(value);
                        if (data.timestamp) {
                            oldestEntry = oldestEntry ? Math.min(oldestEntry, data.timestamp) : data.timestamp;
                            newestEntry = newestEntry ? Math.max(newestEntry, data.timestamp) : data.timestamp;
                        }
                    } catch {
                        // Ignore parse errors
                    }
                }
            }
        }
    } catch (error) {
        logger.warn('[RandomSortCache] Failed to get cache stats', { component: 'RandomSortCache' }, error as Error);
    }

    return { totalEntries, totalSizeBytes, oldestEntry, newestEntry };
}

function loadFromCache<T = unknown>(key: string): CachedRandomSort<T> | null {
    try {
        const data = sessionStorage.getItem(key);
        return data ? (JSON.parse(data) as CachedRandomSort<T>) : null;
    } catch {
        return null;
    }
}

function saveToCache<T = unknown>(key: string, data: CachedRandomSort<T>): void {
    try {
        const serialized = JSON.stringify(data);

        // Check if data exceeds size limit
        if (serialized.length > MAX_CACHE_SIZE_BYTES) {
            logger.warn(`[RandomSortCache] Cache data too large (${serialized.length} bytes), skipping cache`, {
                component: 'RandomSortCache'
            });
            return;
        }

        // Check available storage space (rough estimate)
        const usedSpace = Object.keys(sessionStorage).reduce((total, key) => {
            return total + (sessionStorage.getItem(key)?.length || 0);
        }, 0);

        if (usedSpace + serialized.length > MAX_CACHE_SIZE_BYTES) {
            logger.warn('[RandomSortCache] Insufficient storage space, skipping cache', {
                component: 'RandomSortCache'
            });
            return;
        }

        sessionStorage.setItem(key, serialized);
    } catch (error) {
        logger.warn('[RandomSortCache] Failed to save to cache', { component: 'RandomSortCache' }, error as Error);
        // Try to clean up any partial writes
        try {
            sessionStorage.removeItem(key);
        } catch {
            // Ignore cleanup errors
        }
    }
}

function isExpired(timestamp: number, expirationMs: number): boolean {
    return Date.now() - timestamp > expirationMs;
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        // eslint-disable-next-line sonarjs/pseudo-random
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
