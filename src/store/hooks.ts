/**
 * Component Migration Hooks
 *
 * React hooks for migrating components to use the new store architecture.
 * These hooks provide a bridge between legacy component patterns and the new stores.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ControlSource } from './controlsStore';
import {
    useControlsStore,
    useMediaStore,
    usePlayerStore,
    usePreferencesStore,
    useQueueStore
} from './index';
import type {
    PlayableItem,
    PlaybackProgress,
    PlaybackStatus,
    PlayerInfo,
    RepeatMode,
    ShuffleMode
} from './types';
// Re-export granular visualizer selectors for convenience
export {
    useVisualizerTypeState,
    useFrequencyAnalyzerSettings,
    useWaveSurferSettings,
    useButterchurnSettings,
    useThreeDSettings,
    useVisualizerUISettings,
    useVisualizerAdvancedSettings,
    useCompleteVisualizerSettings
} from './visualizerSelectorStore';

// Playback state hooks
export function usePlaybackStatus(): PlaybackStatus {
    const status = useMediaStore((state) => state.status);
    return status;
}

export function useIsPlaying(): boolean {
    const status = useMediaStore((state) => state.status);
    return status === 'playing';
}

export function useIsPaused(): boolean {
    const status = useMediaStore((state) => state.status);
    return status === 'paused';
}

export function useIsBuffering(): boolean {
    const status = useMediaStore((state) => state.status);
    return status === 'buffering';
}

export function useCurrentItem(): PlayableItem | null {
    const currentItem = useMediaStore((state) => state.currentItem);
    return currentItem;
}

export function useProgress(): PlaybackProgress {
    const progress = useMediaStore((state) => state.progress);
    return progress;
}

export function useBuffered(): number {
    const buffered = useMediaStore((state) => state.progress.buffered);
    return buffered;
}

export function useCurrentTime(): number {
    const currentTime = useMediaStore((state) => state.progress.currentTime);
    return currentTime;
}

export function useDuration(): number {
    const duration = useMediaStore((state) => state.progress.duration);
    return duration;
}

// Volume and audio hooks
export function useVolume(): number {
    const volume = usePreferencesStore((state) => state.audio.volume);
    return volume;
}

export function useIsMuted(): boolean {
    const muted = usePreferencesStore((state) => state.audio.muted);
    return muted;
}

export function usePlaybackRate(): number {
    const playbackRate = useMediaStore((state) => state.playbackRate);
    return playbackRate;
}

// Queue hooks
export function useQueueItems(): PlayableItem[] {
    const items = useQueueStore((state) => state.items.map((qi) => qi.item));
    return items;
}

export function useCurrentQueueIndex(): number {
    const currentIndex = useQueueStore((state) => state.currentIndex);
    return currentIndex;
}

export function useCurrentQueueItem(): PlayableItem | null {
    const item = useQueueStore((state) => state.items[state.currentIndex]?.item ?? null);
    return item;
}

export function useQueueSize(): number {
    const size = useQueueStore((state) => state.items.length);
    return size;
}

export function useRepeatMode(): RepeatMode {
    const repeatMode = useMediaStore((state) => state.repeatMode);
    return repeatMode;
}

export function useShuffleMode(): ShuffleMode {
    const shuffleMode = useQueueStore((state) => state.shuffleMode);
    return shuffleMode;
}

export function useIsShuffled(): boolean {
    const isShuffled = useQueueStore((state) => state.isShuffled);
    return isShuffled;
}

// Player hooks
export function useCurrentPlayer(): PlayerInfo | null {
    const currentPlayer = usePlayerStore((state) => state.currentPlayer);
    return currentPlayer;
}

export function useAvailablePlayers(): PlayerInfo[] {
    const availablePlayers = usePlayerStore((state) => state.availablePlayers);
    return availablePlayers;
}

export function useIsLocalPlayerActive(): boolean {
    const isLocal = usePlayerStore((state) => state.isLocalPlayerActive());
    return isLocal;
}

// Control source hooks
export function useActiveControlSource(): ControlSource {
    const activeSource = useControlsStore((state) => state.activeControlSource);
    return activeSource;
}

export function useIsRemoteActive(): boolean {
    const isRemote = useControlsStore((state) => state.isRemoteActive());
    return isRemote;
}

export function useRemoteClientName(): string | null {
    const clientName = useControlsStore((state) => state.remoteClientName);
    return clientName;
}

export function usePendingTransfer(): ReturnType<
    typeof useControlsStore.getState
>['pendingTransfer'] {
    const pendingTransfer = useControlsStore((state) => state.pendingTransfer);
    return pendingTransfer;
}

export function useShowTransferDialog(): boolean {
    const showDialog = useControlsStore((state) => state.showTransferDialog);
    return showDialog;
}

export function useTransferCountdown(): number | null {
    const countdown = useControlsStore((state) => state.transferCountdown);
    return countdown;
}

// Settings hooks
export function useTheme(): ReturnType<typeof usePreferencesStore.getState>['ui']['theme'] {
    const theme = usePreferencesStore((state) => state.ui.theme);
    return theme;
}

/**
 * @deprecated Use useVisualizerTypeState() from visualizerSelectorStore instead
 * This hook combines two separate properties (enabled + showVisualizer) which causes
 * unnecessary re-renders. Use the granular selectors for better performance.
 */
export function useVisualizerEnabled(): boolean {
    const enabled = usePreferencesStore(
        (state) => state.visualizer.enabled && state.ui.showVisualizer
    );
    return enabled;
}

/**
 * @deprecated Use useVisualizerTypeState() or useVisualizerUISettings() from visualizerSelectorStore instead
 * This hook is narrow in scope but duplicates functionality. Use the new granular selectors.
 */
export function useVisualizerType(): ReturnType<
    typeof usePreferencesStore.getState
>['visualizer']['type'] {
    const type = usePreferencesStore((state) => state.visualizer.type);
    return type;
}

/**
 * @deprecated Use specific selectors from visualizerSelectorStore instead
 * Examples:
 * - useFrequencyAnalyzerSettings() for frequency analyzer
 * - useWaveSurferSettings() for waveform visualizer
 * - useButterchurnSettings() for Butterchurn visualizer
 * - useThreeDSettings() for 3D visualizer
 *
 * This broad subscription causes re-renders on ANY visualizer property change.
 * Use granular selectors to subscribe only to properties your component needs.
 */
export function useVisualizerSettings() {
    const settings = usePreferencesStore((state) => state.visualizer);
    return settings;
}

// Action hooks
export function usePlaybackActions() {
    const mediaStore = useMediaStore.getState();
    const queueStore = useQueueStore.getState();
    const controlsStore = useControlsStore.getState();
    const preferencesStore = usePreferencesStore.getState();

    const play = useCallback(
        (item?: PlayableItem) => {
            if (item) {
                mediaStore.play(item);
                queueStore.setQueue([item], 0);
            } else {
                mediaStore.play();
            }
            controlsStore.play(item);
        },
        [mediaStore, queueStore, controlsStore]
    );

    const pause = useCallback(() => {
        mediaStore.pause();
        controlsStore.pause();
    }, [mediaStore, controlsStore]);

    const stop = useCallback(() => {
        mediaStore.stop();
        controlsStore.stop();
    }, [mediaStore, controlsStore]);

    const togglePlayPause = useCallback(() => {
        if (mediaStore.status === 'playing') {
            mediaStore.pause();
        } else {
            mediaStore.play();
        }
    }, [mediaStore]);

    const seek = useCallback(
        (time: number) => {
            mediaStore.seek(time);
            controlsStore.seek(time);
        },
        [mediaStore, controlsStore]
    );

    const seekPercent = useCallback(
        (percent: number) => {
            const duration = mediaStore.progress.duration;
            const seekTime = (percent / 100) * duration;
            mediaStore.seek(seekTime);
            controlsStore.seek(seekTime);
        },
        [mediaStore, controlsStore]
    );

    const setVolume = useCallback(
        (volume: number) => {
            const clamped = Math.max(0, Math.min(100, volume));
            mediaStore.setVolume(clamped);
            preferencesStore.setVolume(clamped);
        },
        [mediaStore, preferencesStore]
    );

    const toggleMute = useCallback(() => {
        const newMuted = !preferencesStore.audio.muted;
        preferencesStore.setMuted(newMuted);
        mediaStore.setMuted(newMuted);
    }, [mediaStore, preferencesStore]);

    const setPlaybackRate = useCallback(
        (rate: number) => {
            mediaStore.setPlaybackRate(rate);
        },
        [mediaStore]
    );

    return {
        play,
        pause,
        stop,
        togglePlayPause,
        seek,
        seekPercent,
        setVolume,
        toggleMute,
        setPlaybackRate
    };
}

export function useQueueActions() {
    const mediaStore = useMediaStore.getState();
    const queueStore = useQueueStore.getState();
    const controlsStore = useControlsStore.getState();

    const next = useCallback(() => {
        queueStore.next();
        const item = queueStore.items[queueStore.currentIndex]?.item;
        if (item) mediaStore.play(item);
        controlsStore.nextTrack();
    }, [mediaStore, queueStore, controlsStore]);

    const previous = useCallback(() => {
        queueStore.prev();
        const item = queueStore.items[queueStore.currentIndex]?.item;
        if (item) mediaStore.play(item);
        controlsStore.prevTrack();
    }, [mediaStore, queueStore, controlsStore]);

    const setRepeatMode = useCallback(
        (mode: RepeatMode) => {
            queueStore.setRepeatMode(mode);
            mediaStore.setRepeatMode(mode);
        },
        [mediaStore, queueStore]
    );

    const toggleRepeatMode = useCallback(() => {
        const modes: RepeatMode[] = ['RepeatNone', 'RepeatAll', 'RepeatOne'];
        const currentIndex = modes.indexOf(queueStore.repeatMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        const nextMode = modes[nextIndex];
        queueStore.setRepeatMode(nextMode);
        mediaStore.setRepeatMode(nextMode);
    }, [mediaStore, queueStore]);

    const setShuffleMode = useCallback(
        (mode: ShuffleMode) => {
            if (mode === 'Shuffle' && !queueStore.isShuffled) {
                queueStore.shuffle();
            } else if (mode === 'Sorted' && queueStore.isShuffled) {
                queueStore.unshuffle();
            }
            mediaStore.setShuffleMode(mode);
        },
        [mediaStore, queueStore]
    );

    const toggleShuffleMode = useCallback(() => {
        if (queueStore.shuffleMode === 'Sorted') {
            queueStore.shuffle();
            mediaStore.setShuffleMode('Shuffle');
        } else {
            queueStore.unshuffle();
            mediaStore.setShuffleMode('Sorted');
        }
    }, [mediaStore, queueStore]);

    const setQueue = useCallback(
        (items: PlayableItem[], startIndex = 0) => {
            queueStore.setQueue(items, startIndex);
            if (items[startIndex]) {
                mediaStore.play(items[startIndex]);
            }
        },
        [mediaStore, queueStore]
    );

    const addToQueue = useCallback(
        (items: PlayableItem[]) => {
            queueStore.addToQueue(items);
        },
        [queueStore]
    );

    const clearQueue = useCallback(() => {
        queueStore.clearQueue();
        mediaStore.stop();
    }, [mediaStore, queueStore]);

    const removeFromQueue = useCallback(
        (itemIds: string[]) => {
            queueStore.removeFromQueue(itemIds);
        },
        [queueStore]
    );

    const moveItem = useCallback(
        (fromIndex: number, toIndex: number) => {
            queueStore.moveItem(fromIndex, toIndex);
        },
        [queueStore]
    );

    return {
        next,
        previous,
        setRepeatMode,
        toggleRepeatMode,
        setShuffleMode,
        toggleShuffleMode,
        setQueue,
        addToQueue,
        clearQueue,
        removeFromQueue,
        moveItem
    };
}

export function useTransferActions() {
    const controlsStore = useControlsStore.getState();

    const initiateTransfer = useCallback(
        (fromSource: ControlSource, toSource: ControlSource) => {
            controlsStore.initiateTransfer(fromSource, toSource);
        },
        [controlsStore]
    );

    const confirmTransfer = useCallback(() => {
        controlsStore.confirmTransfer();
    }, [controlsStore]);

    const cancelTransfer = useCallback(() => {
        controlsStore.cancelTransfer();
    }, [controlsStore]);

    const acceptTransfer = useCallback(() => {
        controlsStore.acceptTransfer();
    }, [controlsStore]);

    const declineTransfer = useCallback(() => {
        controlsStore.declineTransfer();
    }, [controlsStore]);

    return { initiateTransfer, confirmTransfer, cancelTransfer, acceptTransfer, declineTransfer };
}

// Legacy compatibility hook
export function useLegacyPlaybackManager() {
    const mediaStore = useMediaStore.getState();
    const queueStore = useQueueStore.getState();
    const playerStore = usePlayerStore.getState();
    const preferencesStore = usePreferencesStore.getState();

    return useRef({
        currentTime: () => mediaStore.progress.currentTime,
        duration: () => mediaStore.progress.duration,
        currentItem: () => mediaStore.currentItem,
        isPlaying: () => mediaStore.status === 'playing',
        isPaused: () => mediaStore.status === 'paused',
        getVolume: () => preferencesStore.audio.volume,
        isMuted: () => preferencesStore.audio.muted,
        getRepeatMode: () => mediaStore.repeatMode,
        getShuffleMode: () => queueStore.shuffleMode,
        getCurrentPlayer: () => playerStore.currentPlayer,
        getAvailablePlayers: () => playerStore.availablePlayers,
        isLocalPlayerActive: () => playerStore.isLocalPlayerActive(),
        play: (item?: PlayableItem) => {
            if (item) {
                mediaStore.play(item);
                queueStore.setQueue([item], 0);
            } else {
                mediaStore.play();
            }
        },
        pause: () => mediaStore.pause(),
        stop: () => mediaStore.stop(),
        playPause: () => {
            if (mediaStore.status === 'playing') {
                mediaStore.pause();
            } else {
                mediaStore.play();
            }
        },
        seek: (time: number) => mediaStore.seek(time),
        setVolume: (volume: number) => preferencesStore.setVolume(volume),
        toggleMute: () => preferencesStore.setMuted(!preferencesStore.audio.muted),
        setRepeatMode: (mode: RepeatMode) => {
            queueStore.setRepeatMode(mode);
            mediaStore.setRepeatMode(mode);
        },
        setShuffleMode: (mode: ShuffleMode) => {
            if (mode === 'Shuffle' && !queueStore.isShuffled) {
                queueStore.shuffle();
            } else if (mode === 'Sorted' && queueStore.isShuffled) {
                queueStore.unshuffle();
            }
            mediaStore.setShuffleMode(mode);
        },
        nextTrack: () => {
            queueStore.next();
            const item = queueStore.items[queueStore.currentIndex]?.item;
            if (item) mediaStore.play(item);
        },
        previousTrack: () => {
            queueStore.prev();
            const item = queueStore.items[queueStore.currentIndex]?.item;
            if (item) mediaStore.play(item);
        }
    });
}

// Time formatting hook
export function useFormattedTime() {
    const currentTime = useCurrentTime();
    const duration = useDuration();

    const formatTime = useCallback((seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    return {
        currentTimeFormatted: formatTime(currentTime),
        durationFormatted: formatTime(duration),
        formatTime
    };
}

// Debounced volume hook
export function useDebouncedVolume(delay = 100) {
    const [debouncedVolume, setDebouncedVolume] = useState(useVolume());
    const timeoutRef = useRef<number | null>(null);
    const preferencesStore = usePreferencesStore.getState();

    useEffect(() => {
        const updateVolume = (volume: number) => {
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = window.setTimeout(() => {
                preferencesStore.setVolume(volume);
                setDebouncedVolume(volume);
            }, delay);
        };

        return () => {
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [delay, preferencesStore]);

    return { debouncedVolume, setDebouncedVolume };
}
