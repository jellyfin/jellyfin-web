import { logger } from '../../utils/logger';
import { PlaybackStatus } from '../../store/types';

export interface PlayerEvents {
    onTimeUpdate?: (currentTime: number) => void;
    onDurationChange?: (duration: number) => void;
    onStatusChange?: (status: PlaybackStatus) => void;
    onEnded?: () => void;
    onError?: (error: Error) => void;
    onVolumeChange?: (volume: number, muted: boolean) => void;
    onBufferedChange?: (buffered: number) => void;
}

export class HTML5Player {
    private element: HTMLAudioElement | HTMLVideoElement | null = null;
    private events: PlayerEvents = {};
    private isDestroyed = false;

    constructor(type: 'audio' | 'video' = 'audio') {
        this.element = document.createElement(type);
        this.setupListeners();
    }

    setEvents(events: PlayerEvents) {
        this.events = events;
    }

    load(url: string, autoplay = false) {
        if (!this.element) return;

        logger.debug('HTML5Player loading URL', { component: 'HTML5Player', url, autoplay });
        this.element.src = url;
        this.element.autoplay = autoplay;
        this.element.load();
    }

    play() {
        return this.element?.play().catch(err => {
            logger.error('HTML5Player play failed', { component: 'HTML5Player' }, err);
            throw err;
        });
    }

    pause() {
        this.element?.pause();
    }

    stop() {
        if (!this.element) return;
        this.element.pause();
        this.element.src = '';
        this.element.load();
    }

    seek(timeSeconds: number) {
        if (!this.element) return;
        this.element.currentTime = timeSeconds;
    }

    setVolume(volume: number) {
        if (!this.element) return;
        this.element.volume = Math.max(0, Math.min(1, volume / 100));
    }

    setMuted(muted: boolean) {
        if (!this.element) return;
        this.element.muted = muted;
    }

    setPlaybackRate(rate: number) {
        if (!this.element) return;
        this.element.playbackRate = rate;
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this.stop();
        this.removeListeners();
        this.element?.remove();
        this.element = null;
    }

    private setupListeners() {
        if (!this.element) return;

        this.element.addEventListener('timeupdate', this.handleTimeUpdate);
        this.element.addEventListener('durationchange', this.handleDurationChange);
        this.element.addEventListener('playing', this.handlePlaying);
        this.element.addEventListener('pause', this.handlePause);
        this.element.addEventListener('ended', this.handleEnded);
        this.element.addEventListener('error', this.handleError);
        this.element.addEventListener('volumechange', this.handleVolumeChange);
        this.element.addEventListener('progress', this.handleProgress);
        this.element.addEventListener('waiting', this.handleWaiting);
    }

    private removeListeners() {
        if (!this.element) return;

        this.element.removeEventListener('timeupdate', this.handleTimeUpdate);
        this.element.removeEventListener('durationchange', this.handleDurationChange);
        this.element.removeEventListener('playing', this.handlePlaying);
        this.element.removeEventListener('pause', this.handlePause);
        this.element.removeEventListener('ended', this.handleEnded);
        this.element.removeEventListener('error', this.handleError);
        this.element.removeEventListener('volumechange', this.handleVolumeChange);
        this.element.removeEventListener('progress', this.handleProgress);
        this.element.removeEventListener('waiting', this.handleWaiting);
    }

    private handleTimeUpdate = () => {
        this.events.onTimeUpdate?.(this.element?.currentTime ?? 0);
    };

    private handleDurationChange = () => {
        this.events.onDurationChange?.(this.element?.duration ?? 0);
    };

    private handlePlaying = () => {
        this.events.onStatusChange?.('playing');
    };

    private handlePause = () => {
        if (!this.element?.ended) {
            this.events.onStatusChange?.('paused');
        }
    };

    private handleWaiting = () => {
        this.events.onStatusChange?.('buffering');
    };

    private handleEnded = () => {
        this.events.onStatusChange?.('idle');
        this.events.onEnded?.();
    };

    private handleError = () => {
        const error = this.element?.error;
        const message = error?.message || 'Unknown HTML5 media error';
        const err = new Error(message);
        logger.error('HTML5Player error', { component: 'HTML5Player', code: error?.code }, err);
        this.events.onError?.(err);
    };

    private handleVolumeChange = () => {
        if (!this.element) return;
        this.events.onVolumeChange?.(this.element.volume * 100, this.element.muted);
    };

    private handleProgress = () => {
        if (!this.element || this.element.buffered.length === 0) return;
        const buffered = this.element.buffered.end(this.element.buffered.length - 1);
        this.events.onBufferedChange?.(buffered);
    };

    // Helper to get raw element if needed for WebAudio source
    getElement() {
        return this.element;
    }
}
