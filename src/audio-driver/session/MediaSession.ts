import { logger } from '../../utils/logger';
import { PlayableItem } from '../../store/types';

export interface MediaSessionActions {
    onPlay?: () => void;
    onPause?: () => void;
    onNextTrack?: () => void;
    onPreviousTrack?: () => void;
    onSeekBackward?: () => void;
    onSeekForward?: () => void;
    onSeekTo?: (time: number) => void;
    onStop?: () => void;
}

export class MediaSessionController {
    constructor(private actions: MediaSessionActions) {
        this.setupHandlers();
    }

    updateMetadata(item: PlayableItem | null) {
        if (!('mediaSession' in navigator) || !item) return;

        logger.debug('Updating MediaSession metadata', { component: 'MediaSession', item: item.name });

        navigator.mediaSession.metadata = new MediaMetadata({
            title: item.name,
            artist: item.artist,
            album: item.album,
            artwork: item.imageUrl
                ? [
                      { src: item.imageUrl, sizes: '96x96', type: 'image/png' },
                      { src: item.imageUrl, sizes: '128x128', type: 'image/png' },
                      { src: item.imageUrl, sizes: '192x192', type: 'image/png' },
                      { src: item.imageUrl, sizes: '256x256', type: 'image/png' },
                      { src: item.imageUrl, sizes: '384x384', type: 'image/png' },
                      { src: item.imageUrl, sizes: '512x512', type: 'image/png' }
                  ]
                : []
        });
    }

    updatePlaybackState(status: 'playing' | 'paused' | 'none') {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.playbackState = status;
    }

    updatePositionState(currentTime: number, duration: number, playbackRate: number = 1) {
        if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;

        try {
            if (duration > 0 && currentTime >= 0 && currentTime <= duration) {
                navigator.mediaSession.setPositionState({
                    duration: duration,
                    playbackRate: playbackRate,
                    position: currentTime
                });
            }
        } catch (e) {
            logger.warn('Failed to update MediaSession position state', { component: 'MediaSession' }, e as Error);
        }
    }

    private setupHandlers() {
        if (!('mediaSession' in navigator)) return;

        const actionHandlers: [MediaSessionAction, (() => void) | undefined][] = [
            ['play', this.actions.onPlay],
            ['pause', this.actions.onPause],
            ['previoustrack', this.actions.onPreviousTrack],
            ['nexttrack', this.actions.onNextTrack],
            ['seekbackward', this.actions.onSeekBackward],
            ['seekforward', this.actions.onSeekForward],
            ['stop', this.actions.onStop]
        ];

        for (const [action, handler] of actionHandlers) {
            if (handler) {
                navigator.mediaSession.setActionHandler(action, handler);
            }
        }

        if (this.actions.onSeekTo) {
            try {
                navigator.mediaSession.setActionHandler('seekto', details => {
                    if (details.seekTime !== undefined) {
                        this.actions.onSeekTo?.(details.seekTime);
                    }
                });
            } catch (e) {
                logger.warn('seekto action not supported', { component: 'MediaSession' });
            }
        }
    }
}
