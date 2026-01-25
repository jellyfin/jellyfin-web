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

class HtmlAudioPlayer {
    name: string = 'Html Audio Player';
    type: PluginType = PluginType.MediaPlayer;
    id: string = 'htmlaudioplayer';
    isLocalPlayer: boolean = true;
    priority: number = 1;

    constructor() {
        // Initialize the driver when the plugin is instantiated
        audioDriver.initialize();
    }

    async play(options: PlayOptions): Promise<void> {
        logger.debug('HtmlAudioPlayer.play called, delegating to AudioDriver', {
            component: 'HtmlAudioPlayer',
            options
        });

        const startSeconds = (options.playerStartPositionTicks || 0) / 10000000;

        // Update store with current item info to trigger StoreSync if needed
        // But primarily we load the driver directly here for the imperative path
        await audioDriver.loadAndPlay(options.url, options.item);

        if (startSeconds > 0) {
            audioDriver.seek(startSeconds);
        }

        return audioDriver.play();
    }

    stop(destroyPlayer?: boolean): Promise<void> {
        logger.debug('HtmlAudioPlayer.stop called', { component: 'HtmlAudioPlayer' });
        audioDriver.stop();
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
        // Update the store, AudioDriver subscribes to this
        useSettingsStore.getState().setVolume(val);
    }

    getVolume(): number {
        return useSettingsStore.getState().audio.volume;
    }

    setMute(mute: boolean): void {
        // Update the store, AudioDriver subscribes to this
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
        return (mediaType || '').toLowerCase() === 'audio';
    }

    canPlayItem(item: any): boolean {
        return item.MediaType === 'Audio';
    }

    canPlayUrl(url: string): boolean {
        // Basic check for audio extensions
        return /\.(mp3|flac|m4a|aac|wav|ogg|opus)$/i.test(url);
    }

    getDeviceProfile(item: any): Promise<any> {
        // Return a basic profile or delegate to a helper
        // For now returning a minimal promise as AudioDriver handles capabilities internally
        return Promise.resolve({});
    }
}

export default HtmlAudioPlayer;
