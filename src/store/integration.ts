/**
 * Store Integration Layer
 *
 * Higher-level abstractions for working with stores together.
 * Provides type guards, hooks, and integration helpers.
 */

import type { ControlSource } from './controlsStore';
import {
    useControlsStore,
    useMediaStore,
    usePlayerStore,
    usePreferencesStore,
    useQueueStore
} from './index';
import type { UiSettings, VisualizerSettings } from './settingsStore';
import type {
    PlayableItem,
    PlaybackProgress,
    PlayerInfo,
    QueueItem,
    RepeatMode,
    ShuffleMode
} from './types';

// Type Guards
export function isPlaybackActive(state: ReturnType<typeof useMediaStore.getState>): boolean {
    return state.status === 'playing' || state.status === 'buffering';
}

export function isPlaying(state: ReturnType<typeof useMediaStore.getState>): boolean {
    return state.status === 'playing';
}

export function isPaused(state: ReturnType<typeof useMediaStore.getState>): boolean {
    return state.status === 'paused';
}

export function isBuffering(state: ReturnType<typeof useMediaStore.getState>): boolean {
    return state.status === 'buffering';
}

export function hasCurrentItem(state: ReturnType<typeof useMediaStore.getState>): boolean {
    return state.currentItem !== null;
}

export function isQueueEmpty(state: ReturnType<typeof useQueueStore.getState>): boolean {
    return state.items.length === 0;
}

export function hasNextItem(state: ReturnType<typeof useQueueStore.getState>): boolean {
    const { items, currentIndex, repeatMode } = state;
    if (items.length === 0) return false;
    if (currentIndex < items.length - 1) return true;
    return repeatMode === 'RepeatAll' || repeatMode === 'RepeatOne';
}

export function hasPrevItem(state: ReturnType<typeof useQueueStore.getState>): boolean {
    const { items, currentIndex, repeatMode } = state;
    if (items.length === 0) return false;
    if (currentIndex > 0) return true;
    return repeatMode === 'RepeatAll';
}

export function isLocalPlayerActive(state: ReturnType<typeof usePlayerStore.getState>): boolean {
    return state.currentPlayer?.isLocalPlayer ?? false;
}

export function isRemoteActive(state: ReturnType<typeof useControlsStore.getState>): boolean {
    return state.remoteConnected && Date.now() - state.remoteLastActivity < 5 * 60 * 1000;
}

export function hasPendingTransfer(state: ReturnType<typeof useControlsStore.getState>): boolean {
    return state.pendingTransfer !== null;
}

export function isVisualizerEnabled(
    state: ReturnType<typeof usePreferencesStore.getState>
): boolean {
    return state.visualizer.enabled && state.ui.showVisualizer;
}

// Store Selectors (functions that select data from store state)
export function selectIsPlaying(state: ReturnType<typeof useMediaStore.getState>): boolean {
    return state.status === 'playing';
}

export function selectIsBuffering(state: ReturnType<typeof useMediaStore.getState>): boolean {
    return state.status === 'buffering';
}

export function selectPlaybackStatus(state: ReturnType<typeof useMediaStore.getState>): string {
    return state.status;
}

export function selectCurrentItem(
    state: ReturnType<typeof useMediaStore.getState>
): PlayableItem | null {
    return state.currentItem;
}

export function selectProgress(state: ReturnType<typeof useMediaStore.getState>): PlaybackProgress {
    return state.progress;
}

export function selectQueueItems(state: ReturnType<typeof useQueueStore.getState>): QueueItem[] {
    return state.items;
}

export function selectCurrentQueueItem(
    state: ReturnType<typeof useQueueStore.getState>
): QueueItem | null {
    return state.items[state.currentIndex] ?? null;
}

export function selectRepeatMode(state: ReturnType<typeof useQueueStore.getState>): RepeatMode {
    return state.repeatMode;
}

export function selectShuffleMode(state: ReturnType<typeof useQueueStore.getState>): ShuffleMode {
    return state.shuffleMode;
}

export function selectActiveControlSource(
    state: ReturnType<typeof useControlsStore.getState>
): ControlSource {
    return state.activeControlSource;
}

export function selectActivePlayer(
    state: ReturnType<typeof usePlayerStore.getState>
): PlayerInfo | null {
    return state.currentPlayer;
}

export function selectAudioVolume(state: ReturnType<typeof usePreferencesStore.getState>): number {
    return state.audio.volume;
}

export function selectIsMuted(state: ReturnType<typeof usePreferencesStore.getState>): boolean {
    return state.audio.muted;
}

export function selectTheme(
    state: ReturnType<typeof usePreferencesStore.getState>
): UiSettings['theme'] {
    return state.ui.theme;
}

export function selectVisualizerEnabled(
    state: ReturnType<typeof usePreferencesStore.getState>
): boolean {
    return state.visualizer.enabled && state.ui.showVisualizer;
}

// Combined Selectors
export function selectFullPlaybackState(
    mediaState: ReturnType<typeof useMediaStore.getState>,
    queueState: ReturnType<typeof useQueueStore.getState>
) {
    return {
        status: mediaState.status,
        currentItem: mediaState.currentItem,
        progress: mediaState.progress,
        queueItems: queueState.items,
        currentQueueIndex: queueState.currentIndex,
        repeatMode: queueState.repeatMode,
        shuffleMode: queueState.shuffleMode
    };
}

export function selectFullPlayerState(
    playerState: ReturnType<typeof usePlayerStore.getState>,
    controlsState: ReturnType<typeof useControlsStore.getState>
) {
    return {
        currentPlayer: playerState.currentPlayer,
        availablePlayers: playerState.availablePlayers,
        activeControlSource: controlsState.activeControlSource,
        remoteConnected: controlsState.remoteConnected,
        pendingTransfer: controlsState.pendingTransfer
    };
}

// Control Actions
export function createControlActions() {
    const mediaStore = useMediaStore();
    const queueStore = useQueueStore();
    const controlsStore = useControlsStore();
    const preferencesStore = usePreferencesStore();

    return {
        play: (item?: PlayableItem) => {
            if (item) {
                mediaStore.play(item);
                queueStore.setQueue([item], 0);
            } else {
                mediaStore.play();
            }
            controlsStore.play(item);
        },

        pause: () => {
            mediaStore.pause();
            controlsStore.pause();
        },

        stop: () => {
            mediaStore.stop();
            controlsStore.stop();
        },

        togglePlayPause: () => {
            if (isPlaying(mediaStore)) {
                mediaStore.pause();
            } else {
                mediaStore.play();
            }
        },

        seek: (time: number) => {
            mediaStore.seek(time);
            controlsStore.seek(time);
        },

        setVolume: (volume: number) => {
            const clampedVolume = Math.max(0, Math.min(100, volume));
            mediaStore.setVolume(clampedVolume);
            preferencesStore.setVolume(clampedVolume);
        },

        toggleMute: () => {
            const muted = !preferencesStore.audio.muted;
            preferencesStore.setMuted(muted);
            mediaStore.setMuted(muted);
        },

        nextTrack: () => {
            queueStore.next();
            const currentItem = queueStore.items[queueStore.currentIndex]?.item;
            if (currentItem) {
                mediaStore.play(currentItem);
            }
            controlsStore.nextTrack();
        },

        prevTrack: () => {
            queueStore.prev();
            const currentItem = queueStore.items[queueStore.currentIndex]?.item;
            if (currentItem) {
                mediaStore.play(currentItem);
            }
            controlsStore.prevTrack();
        },

        setRepeatMode: (mode: RepeatMode) => {
            queueStore.setRepeatMode(mode);
            mediaStore.setRepeatMode(mode);
        },

        toggleRepeatMode: () => {
            const modes: RepeatMode[] = ['RepeatNone', 'RepeatAll', 'RepeatOne'];
            const currentIndex = modes.indexOf(queueStore.repeatMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            const nextMode = modes[nextIndex];
            queueStore.setRepeatMode(nextMode);
            mediaStore.setRepeatMode(nextMode);
        },

        setShuffleMode: (mode: ShuffleMode) => {
            if (mode === 'Shuffle' && !queueStore.isShuffled) {
                queueStore.shuffle();
            } else if (mode === 'Sorted' && queueStore.isShuffled) {
                queueStore.unshuffle();
            }
            mediaStore.setShuffleMode(mode);
        },

        toggleShuffleMode: () => {
            if (queueStore.shuffleMode === 'Sorted') {
                queueStore.shuffle();
                mediaStore.setShuffleMode('Shuffle');
            } else {
                queueStore.unshuffle();
                mediaStore.setShuffleMode('Sorted');
            }
        }
    };
}

// Progress utilities
export function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatProgress(progress: PlaybackProgress): string {
    return `${formatTime(progress.currentTime)} / ${formatTime(progress.duration)}`;
}

export function getProgressPercent(progress: PlaybackProgress): number {
    if (progress.duration <= 0) return 0;
    return Math.min(100, Math.max(0, (progress.currentTime / progress.duration) * 100));
}

// Queue utilities
export function getQueuePosition(state: ReturnType<typeof useQueueStore.getState>): string {
    const { currentIndex, items } = state;
    if (items.length === 0) return '0 / 0';
    return `${currentIndex + 1} / ${items.length}`;
}

// Player utilities
export function getPlayerDisplayName(player: PlayerInfo | null): string {
    if (!player) return 'Unknown';
    if (player.isLocalPlayer) return `${player.name} (Local)`;
    return player.name;
}

export function getActiveSourceDisplayName(
    state: ReturnType<typeof useControlsStore.getState>
): string {
    switch (state.activeControlSource) {
        case 'local':
            return 'Local';
        case 'remote':
            return state.remoteClientName || 'Remote';
        case 'server':
            return 'Server';
        default:
            return 'Unknown';
    }
}

// Volume utilities
export function getVolumePercent(volume: number): string {
    return `${Math.round(volume)}%`;
}

export function getVolumeIcon(volume: number, muted: boolean): string {
    if (muted || volume === 0) return '🔇';
    if (volume < 33) return '🔈';
    if (volume < 66) return '🔉';
    return '🔊';
}

// Settings utilities
export function getThemeDisplayName(theme: UiSettings['theme']): string {
    switch (theme) {
        case 'dark':
            return 'Dark';
        case 'light':
            return 'Light';
        case 'system':
            return 'System';
        default:
            return 'Unknown';
    }
}

export function getVisualizerTypeDisplayName(type: VisualizerSettings['type']): string {
    switch (type) {
        case 'waveform':
            return 'Waveform';
        case 'frequency':
            return 'Frequency';
        case 'butterchurn':
            return 'Butterchurn';
        default:
            return 'Unknown';
    }
}

export function getRepeatModeDisplayName(mode: RepeatMode): string {
    switch (mode) {
        case 'RepeatNone':
            return 'Off';
        case 'RepeatAll':
            return 'All';
        case 'RepeatOne':
            return 'One';
        default:
            return 'Unknown';
    }
}

export function getShuffleModeDisplayName(mode: ShuffleMode): string {
    switch (mode) {
        case 'Sorted':
            return 'Sorted';
        case 'Shuffle':
            return 'Shuffle';
        default:
            return 'Unknown';
    }
}
