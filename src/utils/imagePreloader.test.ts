import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { imagePreloader } from './imagePreloader';

const mockFetch = vi.fn();

describe('ImagePreloader', () => {
    beforeEach(() => {
        imagePreloader.clearCacheStatus();
        imagePreloader['imageCache'].clear();
        imagePreloader['requestQueue'].length = 0;
        imagePreloader['activeRequests'].clear();
        mockFetch.mockClear();
        vi.spyOn(window, 'fetch').mockImplementation(mockFetch);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize successfully when Service Worker is available', async () => {
            const mockRegistration = { ready: Promise.resolve({}) } as any;
            Object.defineProperty(navigator, 'serviceWorker', {
                value: { ready: Promise.resolve(mockRegistration) },
                writable: true
            });

            await imagePreloader.init();

            expect(true).toBe(true);
        });

        it('should handle missing Service Worker gracefully', async () => {
            Object.defineProperty(navigator, 'serviceWorker', {
                value: undefined,
                writable: true
            });

            await imagePreloader.init();

            expect(true).toBe(true);
        });
    });

    describe('Queue Image Preloading', () => {
        it('should preload queue images', async () => {
            const queueItems = [
                { itemId: 'track-1', imageUrl: 'https://example.com/image1.jpg' },
                { itemId: 'track-2', imageUrl: 'https://example.com/image2.jpg' },
                { itemId: 'track-3', imageUrl: 'https://example.com/image3.jpg' }
            ];

            mockFetch.mockResolvedValue({
                type: 'opaque',
                ok: true
            });

            await imagePreloader.preloadQueueImages(queueItems);

            expect(mockFetch).toHaveBeenCalledTimes(3);
        });

        it('should handle empty queue', async () => {
            const result = await imagePreloader.preloadQueueImages([]);
            expect(result).toBeUndefined();
        });

        it('should handle queue items without imageUrl', async () => {
            const queueItems = [
                { itemId: 'track-1', imageUrl: 'https://example.com/image1.jpg' },
                { itemId: 'track-2' }
            ];

            mockFetch.mockResolvedValue({
                type: 'opaque',
                ok: true
            });

            await imagePreloader.preloadQueueImages(queueItems);

            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should preload all image types for queue items', async () => {
            const queueItems = [
                {
                    itemId: 'track-1',
                    imageUrl: 'https://example.com/image1.jpg',
                    backdropUrl: 'https://example.com/backdrop1.jpg',
                    artistLogoUrl: 'https://example.com/logo1.png',
                    discImageUrl: 'https://example.com/disc1.png'
                },
                {
                    itemId: 'track-2',
                    imageUrl: 'https://example.com/image2.jpg',
                    backdropUrl: 'https://example.com/backdrop2.jpg',
                    artistLogoUrl: 'https://example.com/logo2.png',
                    discImageUrl: 'https://example.com/disc2.png'
                }
            ];

            mockFetch.mockResolvedValue({
                type: 'opaque',
                ok: true
            });

            await imagePreloader.preloadQueueImages(queueItems);

            expect(mockFetch).toHaveBeenCalledTimes(8);
        });

        it('should preload only available image types', async () => {
            const queueItems = [
                {
                    itemId: 'track-1',
                    imageUrl: 'https://example.com/image1.jpg',
                    discImageUrl: 'https://example.com/disc1.png'
                },
                { itemId: 'track-2', artistLogoUrl: 'https://example.com/logo2.png' }
            ];

            mockFetch.mockResolvedValue({
                type: 'opaque',
                ok: true
            });

            await imagePreloader.preloadQueueImages(queueItems);

            expect(mockFetch).toHaveBeenCalledTimes(3);
        });
    });

    describe('Backdrop Image Preloading', () => {
        it('should preload backdrop images', async () => {
            const backdropUrls = [
                'https://example.com/backdrop1.jpg',
                'https://example.com/backdrop2.jpg',
                'https://example.com/backdrop3.jpg'
            ];

            mockFetch.mockResolvedValue({
                type: 'opaque',
                ok: true
            });

            await imagePreloader.preloadBackdropImages(backdropUrls);

            expect(mockFetch).toHaveBeenCalledTimes(3);
        });

        it('should handle empty backdrop array', async () => {
            const result = await imagePreloader.preloadBackdropImages([]);
            expect(result).toBeUndefined();
        });
    });

    describe('Single Image Preloading', () => {
        it('should cache status as loading initially', async () => {
            let resolvePromise: (value: string) => void;
            const pendingPromise = new Promise<string>(resolve => {
                resolvePromise = resolve;
            });
            mockFetch.mockReturnValue(pendingPromise);

            const preloadPromise = imagePreloader.preloadImage('https://example.com/image.jpg');

            expect(imagePreloader.getCacheStatus('https://example.com/image.jpg')).toBe('loading');

            resolvePromise!('opaque');
            await preloadPromise;
        });

        it('should update status to cached on success', async () => {
            mockFetch.mockResolvedValue({
                type: 'opaque',
                ok: true
            });

            await imagePreloader.preloadImage('https://example.com/image.jpg');

            expect(imagePreloader.getCacheStatus('https://example.com/image.jpg')).toBe('cached');
        });

        it('should update status to error on failure', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            await imagePreloader.preloadImage('https://example.com/image.jpg');

            expect(imagePreloader.getCacheStatus('https://example.com/image.jpg')).toBe('error');
        });

        it('should handle undefined URL', async () => {
            const result = await imagePreloader.preloadImage();
            expect(result).toBe('error');
        });

        it('should deduplicate concurrent requests', async () => {
            mockFetch.mockResolvedValue({
                type: 'opaque',
                ok: true
            });

            const url = 'https://example.com/image.jpg';
            const [result1, result2, result3] = await Promise.all([
                imagePreloader.preloadImage(url),
                imagePreloader.preloadImage(url),
                imagePreloader.preloadImage(url)
            ]);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(result1).toBe('cached');
            expect(result2).toBe('cached');
            expect(result3).toBe('cached');
        });

        it('should reuse cached results', async () => {
            mockFetch.mockResolvedValue({
                type: 'opaque',
                ok: true
            });

            const url = 'https://example.com/image.jpg';

            await imagePreloader.preloadImage(url);
            const result1 = imagePreloader.getCacheStatus(url);

            await imagePreloader.preloadImage(url);
            const result2 = imagePreloader.getCacheStatus(url);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(result1).toBe('cached');
            expect(result2).toBe('cached');
        });
    });

    describe('Cache Status Tracking', () => {
        it('should return unknown for untracked URLs', () => {
            const status = imagePreloader.getCacheStatus('https://example.com/unknown.jpg');
            expect(status).toBe('unknown');
        });

        it('should track loading status', async () => {
            let resolvePromise: (value: string) => void;
            const pendingPromise = new Promise<string>(resolve => {
                resolvePromise = resolve;
            });
            mockFetch.mockReturnValue(pendingPromise);

            const preloadPromise = imagePreloader.preloadImage('https://example.com/image.jpg').catch(() => {});
            expect(imagePreloader.getCacheStatus('https://example.com/image.jpg')).toBe('loading');

            resolvePromise!('opaque');
            await preloadPromise;
        });

        it('should track cached status', async () => {
            mockFetch.mockResolvedValue({
                type: 'opaque',
                ok: true
            });

            await imagePreloader.preloadImage('https://example.com/image.jpg');
            expect(imagePreloader.getCacheStatus('https://example.com/image.jpg')).toBe('cached');
        });

        it('should track error status', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            await imagePreloader.preloadImage('https://example.com/image.jpg');
            expect(imagePreloader.getCacheStatus('https://example.com/image.jpg')).toBe('error');
        });
    });

    describe('Service Worker Cache Checking', () => {
        it('should check cache status when Service Worker is available', async () => {
            const mockCache = {
                match: vi.fn().mockResolvedValue(new Response())
            };
            const mockCaches = {
                open: vi.fn().mockResolvedValue(mockCache)
            };

            global.caches = mockCaches as any;

            const isCached = await imagePreloader.checkCacheStatus('https://example.com/image.jpg');
            expect(isCached).toBe(true);
            expect(mockCaches.open).toHaveBeenCalledWith('jellyfin-images-v1');
        });

        it('should return false when Service Worker is unavailable', async () => {
            global.caches = undefined as any;

            const isCached = await imagePreloader.checkCacheStatus('https://example.com/image.jpg');
            expect(isCached).toBe(false);
        });

        it('should handle cache errors gracefully', async () => {
            const mockCaches = {
                open: vi.fn().mockRejectedValue(new Error('Cache error'))
            };

            global.caches = mockCaches as any;

            const isCached = await imagePreloader.checkCacheStatus('https://example.com/image.jpg');
            expect(isCached).toBe(false);
        });
    });

    describe('Cache Management', () => {
        it('should clear all cache status', async () => {
            mockFetch.mockResolvedValue({
                type: 'opaque',
                ok: true
            });

            await imagePreloader.preloadImage('https://example.com/image1.jpg');
            await imagePreloader.preloadImage('https://example.com/image2.jpg');

            expect(imagePreloader.getCacheStatus('https://example.com/image1.jpg')).toBe('cached');
            expect(imagePreloader.getCacheStatus('https://example.com/image2.jpg')).toBe('cached');

            imagePreloader.clearCacheStatus();

            expect(imagePreloader.getCacheStatus('https://example.com/image1.jpg')).toBe('unknown');
            expect(imagePreloader.getCacheStatus('https://example.com/image2.jpg')).toBe('unknown');
        });

        it('should clear status for specific URLs', async () => {
            mockFetch.mockResolvedValue({
                type: 'opaque',
                ok: true
            });

            await imagePreloader.preloadImage('https://example.com/image1.jpg');
            await imagePreloader.preloadImage('https://example.com/image2.jpg');

            imagePreloader.clearStatusForUrls(['https://example.com/image1.jpg']);

            expect(imagePreloader.getCacheStatus('https://example.com/image1.jpg')).toBe('unknown');
            expect(imagePreloader.getCacheStatus('https://example.com/image2.jpg')).toBe('cached');
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            const result = await imagePreloader.preloadImage('https://example.com/image.jpg');
            expect(result).toBe('error');
        });
    });

    describe('Performance', () => {
        it('should handle large batch preloads efficiently', async () => {
            const images = Array.from({ length: 50 }, (_, i) => ({
                itemId: `track-${i}`,
                imageUrl: `https://example.com/image${i}.jpg`
            }));

            mockFetch.mockResolvedValue({
                type: 'opaque',
                ok: true
            });

            const startTime = Date.now();
            await imagePreloader.preloadQueueImages(images);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(5000);
        });
    });
});
