/**
 * Random Sort Cache Utility Test Suite
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCachedRandomItems, getPaginatedRandomItems } from './randomSortCache';

// Mock sessionStorage
const mockSessionStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0
};

Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true
});

describe('randomSortCache', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getCachedRandomItems', () => {
        it('should fetch and cache items when cache is empty', async () => {
            const cacheKey = 'test-key';
            const items = [{ id: '1' }, { id: '2' }, { id: '3' }];
            const fetchAllItems = vi.fn().mockResolvedValue(items);

            mockSessionStorage.getItem.mockReturnValue(null);

            const result = await getCachedRandomItems(cacheKey, fetchAllItems);

            expect(fetchAllItems).toHaveBeenCalledTimes(1);
            expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(3);
            // Check that it's shuffled (not original order)
            expect(result).not.toEqual(items);
        });

        it('should return cached items when cache is valid', async () => {
            const cacheKey = 'test-key';
            const cachedItems = [{ id: '3' }, { id: '1' }, { id: '2' }];
            const fetchAllItems = vi.fn();

            const cacheData = { items: cachedItems, timestamp: Date.now() };
            mockSessionStorage.getItem.mockReturnValue(JSON.stringify(cacheData));

            const result = await getCachedRandomItems(cacheKey, fetchAllItems);

            expect(fetchAllItems).not.toHaveBeenCalled();
            expect(result).toEqual(cachedItems);
        });

        it('should refetch when cache is expired', async () => {
            const cacheKey = 'test-key';
            const oldItems = [{ id: '1' }, { id: '2' }, { id: '3' }];
            const newItems = [{ id: '4' }, { id: '5' }, { id: '6' }];
            const fetchAllItems = vi.fn().mockResolvedValue(newItems);

            const expiredTimestamp = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
            const cacheData = { items: oldItems, timestamp: expiredTimestamp };
            mockSessionStorage.getItem.mockReturnValue(JSON.stringify(cacheData));

            const result = await getCachedRandomItems(cacheKey, fetchAllItems);

            expect(fetchAllItems).toHaveBeenCalledTimes(1);
            expect(result).not.toEqual(oldItems);
        });

        it('should handle storage errors gracefully', async () => {
            const cacheKey = 'test-key';
            const items = [{ id: '1' }, { id: '2' }, { id: '3' }];
            const fetchAllItems = vi.fn().mockResolvedValue(items);

            // eslint-disable-next-line @stylistic/max-statements-per-line
            mockSessionStorage.getItem.mockImplementation(() => { throw new Error('Storage error'); });
            // eslint-disable-next-line @stylistic/max-statements-per-line
            mockSessionStorage.setItem.mockImplementation(() => { throw new Error('Storage error'); });

            const result = await getCachedRandomItems(cacheKey, fetchAllItems);

            expect(fetchAllItems).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(3);
        });
    });

    describe('getPaginatedRandomItems', () => {
        it('should return paginated items from cache', async () => {
            const cacheKey = 'test-key';
            const allItems = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }];
            const fetchAllItems = vi.fn().mockResolvedValue(allItems);

            mockSessionStorage.getItem.mockReturnValue(null);

            const result = await getPaginatedRandomItems(cacheKey, fetchAllItems, 1, 2);

            expect(result).toHaveLength(2);
            expect(allItems.map(i => i.id)).toEqual(expect.arrayContaining(result.map(i => i.id)));
        });

        it('should handle empty results', async () => {
            const cacheKey = 'test-key';
            const items: any[] = [];
            const fetchAllItems = vi.fn().mockResolvedValue(items);

            mockSessionStorage.getItem.mockReturnValue(null);

            const result = await getPaginatedRandomItems(cacheKey, fetchAllItems, 0, 10);

            expect(result).toEqual([]);
        });
    });
});
