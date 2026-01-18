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

    async init(): Promise<void> {
      if ('serviceWorker' in navigator) {
        this.swRegistration = await navigator.serviceWorker.ready;
      }
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

      await Promise.allSettled(
        imageUrls.map(url => this.preloadImage(url))
      );
    }

    async preloadBackdropImages(imageUrls: string[]): Promise<void> {
      if (!imageUrls.length) return;

      await Promise.allSettled(
        imageUrls.map(url => this.preloadImage(url))
      );
    }

    async preloadImage(url?: string): Promise<CacheStatus> {
      if (!url) return 'error';

      if (this.cacheStatus.has(url)) {
        return this.cacheStatus.get(url)!;
      }

      if (this.imageCache.has(url)) {
        return this.imageCache.get(url)!;
      }

      const loadPromise = this.triggerCacheRequest(url);
      this.imageCache.set(url, loadPromise);

      try {
        const result = await loadPromise;
        this.cacheStatus.set(url, result);
        this.imageCache.delete(url);
        return result;
      } catch (error) {
        this.cacheStatus.set(url, 'error');
        this.imageCache.delete(url);
        return 'error';
      }
    }

    private async triggerCacheRequest(url: string): Promise<CacheStatus> {
      this.cacheStatus.set(url, 'loading');

      try {
        const response = await fetch(url, { mode: 'no-cors' });
        if (response.type === 'opaque' || response.ok) {
          this.cacheStatus.set(url, 'cached');
          return 'cached';
        }
        this.cacheStatus.set(url, 'error');
        return 'error';
      } catch (error) {
        this.cacheStatus.set(url, 'error');
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
