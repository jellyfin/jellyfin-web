/**
 * PlaybackManager Bridge
 *
 * Provides a compatibility layer between the legacy PlaybackManager and the new stores.
 * This bridge allows gradual migration by providing store-backed implementations
 * of commonly used PlaybackManager methods.
 */

import { useMediaStore, useQueueStore, usePlayerStore, useControlsStore, usePreferencesStore } from './index';
import type { PlayableItem, PlaybackProgress, PlaybackStatus, RepeatMode, ShuffleMode, PlayerInfo } from './types';
import type { ControlSource } from './controlsStore';
import { playbackManager } from 'components/playback/playbackmanager';

class PlaybackManagerBridge {
    private static instance: PlaybackManagerBridge;
    private initialized = false;
    private cleanupFunctions: (() => void)[] = [];

    private constructor() {}

    static getInstance(): PlaybackManagerBridge {
        if (!PlaybackManagerBridge.instance) {
            PlaybackManagerBridge.instance = new PlaybackManagerBridge();
        }
        return PlaybackManagerBridge.instance;
    }

    initialize(): void {
        if (this.initialized) return;

        this.initialized = true;
    }

    // Playback state methods
    getCurrentTime(): number {
        const mediaStore = useMediaStore.getState();
        return mediaStore.progress.currentTime;
    }

    getDuration(): number {
        const mediaStore = useMediaStore.getState();
        return mediaStore.progress.duration;
    }

    getCurrentItem(): PlayableItem | null {
        const mediaStore = useMediaStore.getState();
        return mediaStore.currentItem;
    }

    getStatus(): PlaybackStatus {
        const mediaStore = useMediaStore.getState();
        return mediaStore.status;
    }

    isPlaying(): boolean {
        const mediaStore = useMediaStore.getState();
        return mediaStore.status === 'playing';
    }

    isPaused(): boolean {
        const mediaStore = useMediaStore.getState();
        return mediaStore.status === 'paused';
    }

    isBuffering(): boolean {
        const mediaStore = useMediaStore.getState();
        return mediaStore.status === 'buffering';
    }

    getProgress(): PlaybackProgress {
        const mediaStore = useMediaStore.getState();
        return mediaStore.progress;
    }

    // Volume and audio methods
    getVolume(): number {
        const preferencesStore = usePreferencesStore.getState();
        return preferencesStore.audio.volume;
    }

    isMuted(): boolean {
        const preferencesStore = usePreferencesStore.getState();
        return preferencesStore.audio.muted;
    }

    getPlaybackRate(): number {
        const mediaStore = useMediaStore.getState();
        return mediaStore.playbackRate;
    }

    // Queue methods
    getCurrentPlaylistIndex(): number {
        const queueStore = useQueueStore.getState();
        return queueStore.currentIndex;
    }

    getPlaylistItems(): PlayableItem[] {
        const queueStore = useQueueStore.getState();
        return queueStore.items.map(qi => qi.item);
    }

    getQueueSize(): number {
        const queueStore = useQueueStore.getState();
        return queueStore.items.length;
    }

    getRepeatMode(): RepeatMode {
        const mediaStore = useMediaStore.getState();
        return mediaStore.repeatMode;
    }

    getShuffleMode(): ShuffleMode {
        const queueStore = useQueueStore.getState();
        return queueStore.shuffleMode;
    }

    isShuffled(): boolean {
        const queueStore = useQueueStore.getState();
        return queueStore.isShuffled;
    }

    // Player methods
    getCurrentPlayer(): PlayerInfo | null {
        const playerStore = usePlayerStore.getState();
        return playerStore.currentPlayer;
    }

    getPlayerInfo(): PlayerInfo | null {
        return this.getCurrentPlayer();
    }

    getAvailablePlayers(): PlayerInfo[] {
        const playerStore = usePlayerStore.getState();
        return playerStore.availablePlayers;
    }

    isLocalPlayerActive(): boolean {
        const playerStore = usePlayerStore.getState();
        return playerStore.isLocalPlayerActive();
    }

    // Control source methods
    getActiveControlSource(): ControlSource {
        const controlsStore = useControlsStore.getState();
        return controlsStore.getActiveControlSource();
    }

    isRemoteActive(): boolean {
        const controlsStore = useControlsStore.getState();
        return controlsStore.isRemoteActive();
    }

    // Playback actions
    async play(options?: {
        startPosition?: number;
        audioStreamIndex?: number;
        subtitleStreamIndex?: number;
    }): Promise<void> {
        const mediaStore = useMediaStore.getState();
        const queueStore = useQueueStore.getState();
        const controlsStore = useControlsStore.getState();

        if (options?.startPosition !== undefined) {
            mediaStore.seek(options.startPosition);
        }

        mediaStore.play();
        controlsStore.play();
    }

    async pause(): Promise<void> {
        const mediaStore = useMediaStore.getState();
        const controlsStore = useControlsStore.getState();

        mediaStore.pause();
        controlsStore.pause();
    }

    async unpause(): Promise<void> {
        await this.play();
    }

    async stop(): Promise<void> {
        const mediaStore = useMediaStore.getState();
        const controlsStore = useControlsStore.getState();

        mediaStore.stop();
        controlsStore.stop();
    }

    async playPause(): Promise<void> {
        const mediaStore = useMediaStore.getState();

        if (mediaStore.status === 'playing') {
            await this.pause();
        } else {
            await this.play();
        }
    }

    async seek(seekTime: number): Promise<void> {
        const mediaStore = useMediaStore.getState();
        const controlsStore = useControlsStore.getState();

        mediaStore.seek(seekTime);
        controlsStore.seek(seekTime);
    }

    async seekPercent(percent: number): Promise<void> {
        const mediaStore = useMediaStore.getState();
        const duration = mediaStore.progress.duration;
        const seekTime = (percent / 100) * duration;
        await this.seek(seekTime);
    }

    async setVolume(volume: number): Promise<void> {
        const mediaStore = useMediaStore.getState();
        const preferencesStore = usePreferencesStore.getState();
        const controlsStore = useControlsStore.getState();

        const clampedVolume = Math.max(0, Math.min(100, volume));
        mediaStore.setVolume(clampedVolume);
        preferencesStore.setVolume(clampedVolume);
        controlsStore.setVolume(clampedVolume);
    }

    async toggleMute(): Promise<void> {
        const preferencesStore = usePreferencesStore.getState();
        const mediaStore = useMediaStore.getState();

        const newMuted = !preferencesStore.audio.muted;
        preferencesStore.setMuted(newMuted);
        mediaStore.setMuted(newMuted);
    }

    async setPlaybackRate(rate: number): Promise<void> {
        const mediaStore = useMediaStore.getState();
        mediaStore.setPlaybackRate(rate);
    }

    async setRepeatMode(mode: RepeatMode): Promise<void> {
        const mediaStore = useMediaStore.getState();
        const queueStore = useQueueStore.getState();

        mediaStore.setRepeatMode(mode);
        queueStore.setRepeatMode(mode);
    }

    async setShuffleMode(mode: ShuffleMode): Promise<void> {
        const queueStore = useQueueStore.getState();
        const mediaStore = useMediaStore.getState();

        if (mode === 'Shuffle' && !queueStore.isShuffled) {
            queueStore.shuffle();
        } else if (mode === 'Sorted' && queueStore.isShuffled) {
            queueStore.unshuffle();
        }
        mediaStore.setShuffleMode(mode);
    }

    async toggleQueueShuffleMode(): Promise<void> {
        const queueStore = useQueueStore.getState();
        const mediaStore = useMediaStore.getState();

        if (queueStore.shuffleMode === 'Sorted') {
            queueStore.shuffle();
            mediaStore.setShuffleMode('Shuffle');
        } else {
            queueStore.unshuffle();
            mediaStore.setShuffleMode('Sorted');
        }
    }

    async nextTrack(): Promise<void> {
        const queueStore = useQueueStore.getState();
        const mediaStore = useMediaStore.getState();
        const controlsStore = useControlsStore.getState();

        queueStore.next();
        const currentItem = queueStore.items[queueStore.currentIndex]?.item;
        if (currentItem) {
            mediaStore.play(currentItem);
        }
        controlsStore.nextTrack();
    }

    async previousTrack(): Promise<void> {
        const queueStore = useQueueStore.getState();
        const mediaStore = useMediaStore.getState();
        const controlsStore = useControlsStore.getState();

        queueStore.prev();
        const currentItem = queueStore.items[queueStore.currentIndex]?.item;
        if (currentItem) {
            mediaStore.play(currentItem);
        }
        controlsStore.prevTrack();
    }

    // Queue management
    async setQueue(items: PlayableItem[], startIndex = 0): Promise<void> {
        const queueStore = useQueueStore.getState();
        queueStore.setQueue(items, startIndex);

        if (items[startIndex]) {
            const mediaStore = useMediaStore.getState();
            mediaStore.play(items[startIndex]);
        }
    }

    async addToQueue(items: PlayableItem[]): Promise<void> {
        const queueStore = useQueueStore.getState();
        queueStore.addToQueue(items);
    }

    async clearQueue(): Promise<void> {
        const queueStore = useQueueStore.getState();
        queueStore.clearQueue();

        const mediaStore = useMediaStore.getState();
        mediaStore.stop();
    }

    async removeFromQueue(itemIds: string[]): Promise<void> {
        const queueStore = useQueueStore.getState();
        queueStore.removeFromQueue(itemIds);
    }

    async moveQueueItem(fromIndex: number, toIndex: number): Promise<void> {
        const queueStore = useQueueStore.getState();
        queueStore.moveItem(fromIndex, toIndex);
    }

    // Utility methods
    canPlay(item: PlayableItem): boolean {
        const playerStore = usePlayerStore.getState();
        return playerStore.canPlayMediaType(item.mediaType);
    }

    getSupportedCommands(): string[] {
        const currentPlayer = this.getCurrentPlayer();
        return currentPlayer?.supportedCommands || [];
    }

    getBufferedRanges(): { start: number; end: number }[] {
        try {
            const currentPlayer = playbackManager.getCurrentPlayer();
            if (currentPlayer && typeof currentPlayer.getBufferedRanges === 'function') {
                return currentPlayer.getBufferedRanges();
            }
        } catch {
            // Player may not be available
        }
        return [];
    }

    enableDisplayMirroring(): boolean {
        return false;
    }

    destroy(): void {
        for (const cleanup of this.cleanupFunctions) {
            cleanup();
        }
        this.cleanupFunctions = [];
        this.initialized = false;
    }
}

export const playbackManagerBridge = PlaybackManagerBridge.getInstance();
export const getPlaybackManager = () => playbackManagerBridge;
