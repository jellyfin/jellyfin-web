import { HTML5Player } from './html5/HTML5Player';
import { MediaSessionController } from './session/MediaSession';
import { useMediaStore, useQueueStore, useSettingsStore } from '../store';
import { PlaybackStatus } from '../store/types';
import { logger } from '../utils/logger';

export class AudioDriver {
    private static instance: AudioDriver;
    private player: HTML5Player;
    private mediaSession: MediaSessionController;
    private isInitialized = false;

    private constructor() {
        this.player = new HTML5Player('audio');
        this.mediaSession = new MediaSessionController({
            onPlay: () => this.play(),
            onPause: () => this.pause(),
            onNextTrack: () => this.next(),
            onPreviousTrack: () => this.previous(),
            onSeekBackward: () => this.seekRelative(-10),
            onSeekForward: () => this.seekRelative(10),
            onSeekTo: (time) => this.seek(time),
            onStop: () => this.stop()
        });

        this.setupPlayerEvents();
        this.setupStoreSubscriptions();
    }

    static getInstance(): AudioDriver {
        if (!AudioDriver.instance) {
            AudioDriver.instance = new AudioDriver();
        }
        return AudioDriver.instance;
    }

    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        logger.info('AudioDriver initialized', { component: 'AudioDriver' });
    }

    async loadAndPlay(url: string, item: any) {
        this.player.load(url, true);
        this.mediaSession.updateMetadata(item);
    }

    play() {
        return this.player.play();
    }

    pause() {
        this.player.pause();
    }

    stop() {
        this.player.stop();
    }

    seek(timeSeconds: number) {
        this.player.seek(timeSeconds);
    }

    seekRelative(seconds: number) {
        const { currentTime } = useMediaStore.getState().progress;
        this.seek(currentTime + seconds);
    }

    next() {
        const { next } = useQueueStore.getState();
        next();
        // The store subscription will trigger loading the next track
    }

    previous() {
        const { prev } = useQueueStore.getState();
        prev();
    }

    private setupPlayerEvents() {
        this.player.setEvents({
            onTimeUpdate: (time) => {
                useMediaStore.getState().setProgress({ currentTime: time });
                this.updateMediaSessionPosition();
            },
            onDurationChange: (duration) => {
                useMediaStore.getState().setProgress({ duration });
                this.updateMediaSessionPosition();
            },
            onStatusChange: (status) => {
                useMediaStore.getState().setStatus(status);
                this.mediaSession.updatePlaybackState(status === 'playing' ? 'playing' : status === 'paused' ? 'paused' : 'none');
            },
            onBufferedChange: (buffered) => {
                useMediaStore.getState().setProgress({ buffered });
            },
            onVolumeChange: (volume, muted) => {
                // Sync back to store if changed externally (e.g. OS volume)
                // Note: be careful about loops
            },
            onError: (err) => {
                useMediaStore.getState().setError(err.message);
            },
            onEnded: () => {
                this.next();
            }
        });
    }

    private setupStoreSubscriptions() {
        // Subscribe to item changes
        useMediaStore.subscribe(
            (state) => state.currentItem,
            (item) => {
                if (item) {
                    this.mediaSession.updateMetadata(item);
                    // Actual loading happens in the bridge or here depending on logic
                }
            }
        );

        // Subscribe to volume changes
        useSettingsStore.subscribe(
            (state) => state.audio.volume,
            (volume) => this.player.setVolume(volume)
        );

        useSettingsStore.subscribe(
            (state) => state.audio.muted,
            (muted) => this.player.setMuted(muted)
        );
    }

    private updateMediaSessionPosition() {
        const { currentTime, duration } = useMediaStore.getState().progress;
        const { playbackRate } = useMediaStore.getState();
        this.mediaSession.updatePositionState(currentTime, duration, playbackRate);
    }

    getElement() {
        return this.player.getElement();
    }
}

export const audioDriver = AudioDriver.getInstance();
