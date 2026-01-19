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
    private imageCache = new Map<string, Promise<CacheStatus>>();
    private cacheStatus = new Map<string, CacheStatus>();
    private readonly IMAGE_CACHE_NAME = 'jellyfin-images-v1';
    private readonly MAX_CONCURRENT = 6;
    private readonly activeRequests = new Set<string>();
    private readonly requestQueue: Array<{url: string; resolve: (status: CacheStatus) => void}> = [];

    async init(): Promise<void> {
      if ('serviceWorker' in navigator) {
        this.swRegistration = await navigator.serviceWorker.ready;
      }
    }

    private tryProcessQueue(): void {
        while (this.requestQueue.length > 0 && this.activeRequests.size < this.MAX_CONCURRENT) {
            const next = this.requestQueue.shift();
            if (next) {
                this.processImage(next.url).then(next.resolve);
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

    async preloadQueueImages(queueItems: QueueItem[]): Promise<void> {
      if (!queueItems.length) return;

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

    async preloadBackdropImages(imageUrls: string[]): Promise<void> {
      if (!imageUrls.length) return;

      await Promise.all(
        imageUrls.map(url => this.preloadImage(url))
      );
    }

    async preloadImage(url?: string, priority: 'high' | 'low' = 'low'): Promise<CacheStatus> {
      if (!url) return 'error';

      if (this.cacheStatus.has(url)) {
        const status = this.cacheStatus.get(url)!;
        if (status === 'loading' && this.imageCache.has(url)) {
          return this.imageCache.get(url)!;
        }
        return status;
      }

      if (this.imageCache.has(url)) {
        return this.imageCache.get(url)!;
      }

      this.cacheStatus.set(url, 'loading');

      let result: CacheStatus;
      if (priority === 'high' && this.activeRequests.size >= this.MAX_CONCURRENT) {
        result = await this.queueImage(url);
      } else {
        result = await this.processImage(url);
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

    getCacheStatus(url: string): CacheStatus {
      return this.cacheStatus.get(url) || 'unknown';
    }

    async checkCacheStatus(url: string): Promise<boolean> {
      if (!this.swRegistration) return false;

      try {
        const cache = await caches.open(this.IMAGE_CACHE_NAME);
        const cached = await cache.match(url);
        return !!cached;
      } catch {
        return false;
      }
    }

    clearCacheStatus(): void {
      this.cacheStatus.clear();
    }

    clearStatusForUrls(urls: string[]): void {
      urls.forEach(url => {
        this.cacheStatus.delete(url);
      });
    }
}

export const imagePreloader = new ImagePreloader();
export type { QueueItem, CacheStatus };
