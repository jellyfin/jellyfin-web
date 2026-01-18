import { imagePreloader, QueueItem } from '../../utils/imagePreloader';
import { preloadNextTrack, resetPreloadedTrack } from './crossfadeController';

type CrossfadePreloadOptions = {
    itemId: string;
    url: string;
    imageUrl?: string;
    backdropUrl?: string;
    artistLogoUrl?: string;
    discImageUrl?: string;
    crossOrigin?: string | null;
    volume: number;
    muted: boolean;
    normalizationGainDb?: number;
    timeoutMs?: number;
};

class CrossfadeImageIntegration {
    private isInitialized = false;

    async init(): Promise<void> {
      if (this.isInitialized) return;

      await imagePreloader.init();
      this.isInitialized = true;
    }

    async preloadForCrossfade(options: CrossfadePreloadOptions): Promise<boolean> {
      if (!this.isInitialized) {
        await this.init();
      }

      const { itemId, url, imageUrl, backdropUrl, artistLogoUrl, discImageUrl, crossOrigin, volume, muted, normalizationGainDb, timeoutMs } = options;

      const audioPreload = preloadNextTrack({
        itemId,
        url,
        crossOrigin,
        volume,
        muted,
        normalizationGainDb,
        timeoutMs: timeoutMs || 15000
      });

      const imagePromises: Promise<void>[] = [];

      if (imageUrl) {
        imagePromises.push(
          imagePreloader.preloadImage(imageUrl).then(() => {})
        );
      }

      if (backdropUrl) {
        imagePromises.push(
          imagePreloader.preloadImage(backdropUrl).then(() => {})
        );
      }

      if (artistLogoUrl) {
        imagePromises.push(
          imagePreloader.preloadImage(artistLogoUrl).then(() => {})
        );
      }

      if (discImageUrl) {
        imagePromises.push(
          imagePreloader.preloadImage(discImageUrl).then(() => {})
        );
      }

      const [audioResult] = await Promise.allSettled([audioPreload, ...imagePromises]);

      return audioResult.status === 'fulfilled' ? audioResult.value : false;
    }

    preloadQueueImages(queueItems: QueueItem[]): void {
      imagePreloader.preloadQueueImages(queueItems);
    }

    reset(): void {
      resetPreloadedTrack();
      imagePreloader.clearCacheStatus();
    }

    getCacheStatus(url: string): 'unknown' | 'cached' | 'loading' | 'error' {
      return imagePreloader.getCacheStatus(url);
    }
}

export const crossfadeImageIntegration = new CrossfadeImageIntegration();
export type { CrossfadePreloadOptions };
