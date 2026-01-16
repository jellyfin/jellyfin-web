/**
 * Random Sort Cache Utility
 * Caches randomized item orders for consistent library sorting.
 */

interface CachedRandomSort {
    items: any[];
    timestamp: number;
}

const CACHE_KEY_PREFIX = 'randomSortCache-';
const DEFAULT_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Gets cached random items or fetches and caches them.
 * @param cacheKey Unique key for the cache (e.g., library ID + sort).
 * @param fetchAllItems Function to fetch all items.
 * @param expirationMs Cache expiration time in milliseconds.
 * @returns Promise resolving to all items in random order.
 */
export async function getCachedRandomItems(
    cacheKey: string,
    fetchAllItems: () => Promise<any[]>,
    expirationMs: number = DEFAULT_EXPIRATION_MS
): Promise<any[]> {
    const fullKey = CACHE_KEY_PREFIX + cacheKey;
    const cached = loadFromCache(fullKey);

    if (cached && !isExpired(cached.timestamp, expirationMs)) {
        return cached.items;
    }

    const items = await fetchAllItems();
    const randomized = shuffleArray(items);
    saveToCache(fullKey, { items: randomized, timestamp: Date.now() });
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
    return allItems.slice(startIndex, startIndex + limit);
}

function loadFromCache(key: string): CachedRandomSort | null {
    try {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

function saveToCache(key: string, data: CachedRandomSort): void {
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
    } catch {
        // Ignore storage errors
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
