import { PluginType } from '../../types/plugin';
import { audioDriver } from '../../audio-driver/AudioDriver';
import { useMediaStore, useSettingsStore } from '../../store';
import { logger } from '../../utils/logger';

interface PlayOptions {
    url: string;
    item?: any;
    mediaSource?: any;
    playerStartPositionTicks?: number;
}

class HtmlVideoPlayer {
    name: string = 'Html Video Player';
    type: PluginType = PluginType.MediaPlayer;
    id: string = 'htmlvideoplayer';
    isLocalPlayer: boolean = true;
    priority: number = 1;

    constructor() {
        audioDriver.initialize();
    }

    async play(options: PlayOptions): Promise<void> {
        logger.debug('HtmlVideoPlayer.play called, delegating to AudioDriver', { component: 'HtmlVideoPlayer', options });

        const startSeconds = (options.playerStartPositionTicks || 0) / 10000000;
        
        // Ensure the driver knows this is a video item
        const itemWithMediaType = { ...options.item, mediaType: 'Video' };

        await audioDriver.loadAndPlay(options.url, itemWithMediaType);
        
        if (startSeconds > 0) {
            audioDriver.seek(startSeconds);
        }
        
        // Attach video element to the DOM if not already present
        this.ensureVideoElementAttached();

        return audioDriver.play();
    }

    stop(destroyPlayer?: boolean): Promise<void> {
        logger.debug('HtmlVideoPlayer.stop called', { component: 'HtmlVideoPlayer' });
        audioDriver.stop();
        if (destroyPlayer) {
            this.destroy();
        }
        return Promise.resolve();
    }

    pause(): void {
        audioDriver.pause();
    }

    unpause(): void {
        audioDriver.play();
    }

    seek(ticks: number): void {
        const seconds = ticks / 10000000;
        audioDriver.seek(seconds);
    }

    setVolume(val: number): void {
        useSettingsStore.getState().setVolume(val);
    }

    getVolume(): number {
        return useSettingsStore.getState().audio.volume;
    }

    setMute(mute: boolean): void {
        useSettingsStore.getState().setMuted(mute);
    }

    isMuted(): boolean {
        return useSettingsStore.getState().audio.muted;
    }

    currentTime(val?: number): number | void {
        if (val !== undefined) {
            audioDriver.seek(val / 1000);
            return;
        }
        return useMediaStore.getState().progress.currentTime * 1000;
    }

    duration(): number {
        return useMediaStore.getState().progress.duration * 1000;
    }

    paused(): boolean {
        return useMediaStore.getState().status === 'paused';
    }

    canPlayMediaType(mediaType: string): boolean {
        return (mediaType || '').toLowerCase() === 'video';
    }

    canPlayItem(item: any): boolean {
        return item.MediaType === 'Video';
    }

    canPlayUrl(url: string): boolean {
        return /\.(mp4|webm|mkv|mov|m4v)$/i.test(url);
    }

    getDeviceProfile(item: any): Promise<any> {
        return Promise.resolve({});
    }

    destroy(): void {
        const videoElement = audioDriver.getVideoPlayer().getElement();
        if (videoElement && videoElement.parentNode) {
            videoElement.parentNode.removeChild(videoElement);
        }
    }

    private ensureVideoElementAttached() {
        const videoElement = audioDriver.getVideoPlayer().getElement();
        if (videoElement && !document.body.contains(videoElement)) {
            videoElement.classList.add('mediaPlayerVideo');
            // Ensure it's visible/positioned correctly - legacy styling relied on this class
            // We might need to append it to a specific container for the video player UI
            const container = document.querySelector('.videoPlayerContainer') || document.body;
            container.appendChild(videoElement);
        }
    }
    
    // Stub methods for features not yet fully migrated to driver
    // but required by the interface
    setPlaybackRate(value: number): void {
        audioDriver.getVideoPlayer().setPlaybackRate(value);
    }
    
    getPlaybackRate(): number {
        return 1; // Retrieve from store/element if needed
    }
    
    requestPictureInPicture() {
        audioDriver.getVideoPlayer().requestPictureInPicture();
    }
}

export default HtmlVideoPlayer;