import { HTML5Player } from './html5/HTML5Player';
import { VideoPlayer } from './html5/VideoPlayer';
import { MediaSessionController } from './session/MediaSession';
import { useMediaStore, useQueueStore, useSettingsStore } from '../store';
import { PlaybackStatus } from '../store/types';
import { logger } from '../utils/logger';

export class AudioDriver {
    private static instance: AudioDriver;
    private audioPlayer: HTML5Player;
    private videoPlayer: VideoPlayer;
    private activePlayer: HTML5Player; // VideoPlayer extends HTML5Player
    private mediaSession: MediaSessionController;
    private isInitialized = false;

    private constructor() {
        this.audioPlayer = new HTML5Player('audio');
        this.videoPlayer = new VideoPlayer();
        this.activePlayer = this.audioPlayer; // Default to audio

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

        this.setupPlayerEvents(this.audioPlayer);
        this.setupPlayerEvents(this.videoPlayer);
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
        // Determine player type based on item or explicitly passed type
        const isVideo = item?.mediaType === 'Video' || item?.MediaType === 'Video';
        
        // Stop current player if switching types
        if (isVideo && this.activePlayer !== this.videoPlayer) {
            this.audioPlayer.stop();
            this.activePlayer = this.videoPlayer;
        } else if (!isVideo && this.activePlayer !== this.audioPlayer) {
            this.videoPlayer.stop();
            this.activePlayer = this.audioPlayer;
        }

        this.activePlayer.load(url, true);
        this.mediaSession.updateMetadata(item);
        
        // Sync volume to new player
        const { volume, muted } = useSettingsStore.getState().audio;
        this.activePlayer.setVolume(volume);
        this.activePlayer.setMuted(muted);
    }

    play() {
        return this.activePlayer.play();
    }

    pause() {
        this.activePlayer.pause();
    }

    stop() {
        this.activePlayer.stop();
    }

    seek(timeSeconds: number) {
        this.activePlayer.seek(timeSeconds);
    }

    seekRelative(seconds: number) {
        const { currentTime } = useMediaStore.getState().progress;
        this.seek(currentTime + seconds);
    }

    next() {
        const { next } = useQueueStore.getState();
        next();
    }

    previous() {
        const { prev } = useQueueStore.getState();
        prev();
    }

    private setupPlayerEvents(player: HTML5Player) {
        player.setEvents({
            onTimeUpdate: (time) => {
                if (player !== this.activePlayer) return;
                useMediaStore.getState().setProgress({ currentTime: time });
                this.updateMediaSessionPosition();
            },
            onDurationChange: (duration) => {
                if (player !== this.activePlayer) return;
                useMediaStore.getState().setProgress({ duration });
                this.updateMediaSessionPosition();
            },
            onStatusChange: (status) => {
                if (player !== this.activePlayer) return;
                useMediaStore.getState().setStatus(status);
                this.mediaSession.updatePlaybackState(status === 'playing' ? 'playing' : status === 'paused' ? 'paused' : 'none');
            },
            onBufferedChange: (buffered) => {
                if (player !== this.activePlayer) return;
                useMediaStore.getState().setProgress({ buffered });
            },
            onVolumeChange: (volume, muted) => {
                if (player !== this.activePlayer) return;
                // Sync back to store if changed externally (e.g. OS volume)
            },
            onError: (err) => {
                if (player !== this.activePlayer) return;
                useMediaStore.getState().setError(err.message);
            },
            onEnded: () => {
                if (player !== this.activePlayer) return;
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
                }
            }
        );

        useSettingsStore.subscribe(
            (state) => state.audio.volume,
            (volume) => {
                if (this.activePlayer) {
                    this.activePlayer.setVolume(volume);
                }
            }
        );

        useSettingsStore.subscribe(
            (state) => state.audio.muted,
            (muted) => {
                if (this.activePlayer) {
                    this.activePlayer.setMuted(muted);
                }
            }
        );

        // Sync playback rate
        useMediaStore.subscribe(
            (state) => state.playbackRate,
            (rate) => {
                if (this.activePlayer) {
                    this.activePlayer.setPlaybackRate(rate);
                }
            }
        );
    }

    private updateMediaSessionPosition() {
        const { currentTime, duration } = useMediaStore.getState().progress;
        const { playbackRate } = useMediaStore.getState();
        this.mediaSession.updatePositionState(currentTime, duration, playbackRate);
    }

    getElement() {
        return this.activePlayer.getElement();
    }
    
    // Explicitly for Video Player access
    getVideoPlayer(): VideoPlayer {
        return this.videoPlayer;
    }
}

export const audioDriver = AudioDriver.getInstance();