/**
 * Example: Queue View Integration
 *
 * This file demonstrates how to integrate the image preloader
 * with the queue view component to ensure smooth track transitions.
 */

import { imagePreloader, QueueItem } from '../src/utils/imagePreloader';
import { crossfadeImageIntegration } from '../src/components/audioEngine/crossfadeImageIntegration';

export class QueueViewExample {
    private isInitialized = false;

    async initialize() {
      if (this.isInitialized) return;

      await imagePreloader.init();
      await crossfadeImageIntegration.init();

      this.isInitialized = true;
    }

    /**
     * Called when queue changes (new tracks added, reordered, etc.)
     */
    onQueueChanged(queueItems: QueueItem[]) {
      if (!this.isInitialized) {
        this.initialize();
      }

      imagePreloader.preloadQueueImages(queueItems);
    }

    /**
     * Called when user skips to next track
     */
    async onSkipToNext(currentTrack: any, nextTrack: any) {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await crossfadeImageIntegration.preloadForCrossfade({
        itemId: nextTrack.id,
        url: nextTrack.audioUrl,
        imageUrl: nextTrack.imageUrl,
        backdropUrl: nextTrack.backdropUrl,
        artistLogoUrl: nextTrack.artistLogoUrl,
        discImageUrl: nextTrack.discImageUrl,
        crossOrigin: 'anonymous',
        volume: 100,
        muted: false,
        normalizationGainDb: -3,
        timeoutMs: 15000
      });

      this.startCrossfade(currentTrack, nextTrack);
    }

    /**
     * Called when crossfade completes
     */
    onCrossfadeComplete(newTrack: any) {
      this.updateNowPlayingImage(newTrack.imageUrl);
      this.updateBackdrop(newTrack.backdropUrl);
      this.updateArtistLogo(newTrack.artistLogoUrl);
      this.updateDiscImage(newTrack.discImageUrl);
    }

    private startCrossfade(currentTrack: any, nextTrack: any) {
      console.log('Starting crossfade from', currentTrack.id, 'to', nextTrack.id);
    }

    private updateNowPlayingImage(imageUrl: string) {
      const imgElement = document.querySelector('.now-playing-image') as HTMLImageElement;
      if (imgElement) {
        imgElement.src = imageUrl;
      }
    }

    private updateBackdrop(backdropUrl: string) {
      const backdropElement = document.querySelector('.backdrop-container') as HTMLDivElement;
      if (backdropElement) {
        backdropElement.style.backgroundImage = `url('${backdropUrl}')`;
      }
    }

    private updateArtistLogo(logoUrl: string) {
      const logoElement = document.querySelector('.artist-logo') as HTMLImageElement;
      if (logoElement && logoUrl) {
        logoElement.src = logoUrl;
      }
    }

    private updateDiscImage(discUrl: string) {
      const discElement = document.querySelector('.discImage') as HTMLImageElement;
      if (discElement && discUrl) {
        discElement.src = discUrl;
        discElement.classList.remove('hide');
      } else if (discElement && !discUrl) {
        discElement.classList.add('hide');
      }
    }
  }
