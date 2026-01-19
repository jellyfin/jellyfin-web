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

      // Return cached result if already determined
      if (this.cacheStatus.has(url)) {
        const status = this.cacheStatus.get(url)!;
        // If it's still loading, return the pending promise instead
        if (status === 'loading' && this.imageCache.has(url)) {
          return this.imageCache.get(url)!;
        }
        return status;
      }

      // Return pending promise if already loading
      if (this.imageCache.has(url)) {
        return this.imageCache.get(url)!;
      }

      // Set status to loading BEFORE creating the promise chain
      // This ensures getCacheStatus() returns 'loading' immediately
      this.cacheStatus.set(url, 'loading');

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
      // Status is already set to 'loading' in preloadImage()
      // This function just performs the actual fetch
      try {
        const response = await fetch(url, { mode: 'no-cors' });
        if (response.type === 'opaque' || response.ok) {
          return 'cached';
        }
        return 'error';
      } catch (error) {
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
