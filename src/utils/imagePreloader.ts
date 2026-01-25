interface QueueItem {
    itemId: string;
    imageUrl?: string;
    backdropUrl?: string;
    artistLogoUrl?: string;
    discImageUrl?: string;
}

type CacheStatus = 'unknown' | 'cached' | 'loading' | 'error';

class ImagePreloader {
    private swRegistration: ServiceWorkerRegistration | null = null;

    private readonly imageCache = new Map<string, Promise<CacheStatus>>();

    private readonly cacheStatus = new Map<string, CacheStatus>();

    private readonly imageCacheName = 'jellyfin-images-v1';

    private readonly maxConcurrent = 6;

    private readonly activeRequests = new Set<string>();

    private readonly requestQueue: Array<{ url: string; resolve: (status: CacheStatus) => void }> = [];

    public async init(): Promise<void> {
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.ready;
            } catch {
                // Service worker not available
            }
        }
    }

    private tryProcessQueue(): void {
        while (this.requestQueue.length > 0 && this.activeRequests.size < this.maxConcurrent) {
            const next = this.requestQueue.shift();
            if (next) {
                void this.processImage(next.url).then(next.resolve);
            }
        }
    }

    private async processImage(url: string): Promise<CacheStatus> {
        this.activeRequests.add(url);
        try {
            const response = await fetch(url, { mode: 'no-cors' });
            if (response.type === 'opaque' || response.ok) {
                return 'cached';
            }
            return 'error';
        } catch {
            return 'error';
        } finally {
            this.activeRequests.delete(url);
            this.tryProcessQueue();
        }
    }

    private queueImage(url: string): Promise<CacheStatus> {
        return new Promise((resolve) => {
            this.requestQueue.push({ url, resolve });
            this.tryProcessQueue();
        });
    }

    public async preloadQueueImages(queueItems: QueueItem[]): Promise<void> {
        if (queueItems.length === 0) return;

        const upcomingItems = queueItems.slice(0, 5);

        const imageUrls: string[] = [];

        for (const item of upcomingItems) {
            if (item.imageUrl) imageUrls.push(item.imageUrl);
            if (item.backdropUrl) imageUrls.push(item.backdropUrl);
            if (item.artistLogoUrl) imageUrls.push(item.artistLogoUrl);
            if (item.discImageUrl) imageUrls.push(item.discImageUrl);
        }

        await Promise.all(
            imageUrls.map(url => this.preloadImage(url))
        );
    }

    public async preloadBackdropImages(imageUrls: string[]): Promise<void> {
        if (imageUrls.length === 0) return;

        const urls = imageUrls.filter((url): url is string => url != null && url.length > 0);
        if (urls.length === 0) return;

        await Promise.all(
            urls.map(url => this.preloadImage(url))
        );
    }

    public async preloadImage(url?: string, priority: 'high' | 'low' = 'low'): Promise<CacheStatus> {
        if (url == null || url === '') return 'error';

        const cachedStatus = this.cacheStatus.get(url);
        if (cachedStatus !== undefined) {
            if (cachedStatus === 'loading') {
                const cachedPromise = this.imageCache.get(url);
                if (cachedPromise) return cachedPromise;
            }
            return cachedStatus;
        }

        const cachedPromise = this.imageCache.get(url);
        if (cachedPromise) return cachedPromise;

        this.cacheStatus.set(url, 'loading');

        let result: CacheStatus;
        if (priority === 'high' && this.activeRequests.size >= this.maxConcurrent) {
            result = await this.queueImage(url);
        } else {
            const processPromise = this.processImage(url);
            this.imageCache.set(url, processPromise);
            result = await processPromise;
        }

        this.cacheStatus.set(url, result);
        return result;
    }

    private async triggerCacheRequest(url: string): Promise<CacheStatus> {
        try {
            const response = await fetch(url, { mode: 'no-cors' });
            if (response.type === 'opaque' || response.ok) {
                return 'cached';
            }
            return 'error';
        } catch {
            return 'error';
        }
    }

    public getCacheStatus(url: string): CacheStatus {
        const status = this.cacheStatus.get(url);
        return status ?? 'unknown';
    }

    public async checkCacheStatus(url: string): Promise<boolean> {
        if (!this.swRegistration) return false;

        try {
            const cache = await caches.open(this.imageCacheName);
            const cached = await cache.match(url);
            return cached !== undefined;
        } catch {
            return false;
        }
    }

    public clearCacheStatus(): void {
        this.cacheStatus.clear();
    }

    public clearStatusForUrls(urls: string[]): void {
        for (const url of urls) {
            this.cacheStatus.delete(url);
        }
    }
}

export const imagePreloader = new ImagePreloader();
export type { QueueItem, CacheStatus };
