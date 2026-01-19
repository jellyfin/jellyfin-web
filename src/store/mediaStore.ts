/**
 * Media Store - Core Playback State
 *
 * Zustand store for managing media playback state across all media types.
 * Handles current item, playback status, progress, and metadata.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { PlayableItem, PlaybackProgress, PlaybackState, PlaybackStatus, StreamInfo, TrackInfo, RepeatMode, ShuffleMode } from './types';
import { shouldTranscode, type TranscodeDecision, type StreamInfo as PolicyStreamInfo } from './domain/playback/transcodePolicy';

export interface MediaState extends PlaybackState {
    // Current item details
    currentItem: PlayableItem | null;
    streamInfo: StreamInfo | null;

    // Track information
    trackInfo: TrackInfo | null;

    // Playback controls
    playbackRate: number;

    // Error handling
    lastError: { message: string; timestamp: number } | null;
    isLoading: boolean;
}

export interface MediaActions {
    // Playback control
    play: (item?: PlayableItem) => void;
    pause: () => void;
    stop: () => void;
    togglePlayPause: () => void;
    seek: (time: number) => void;
    setPlaybackRate: (rate: number) => void;

    // Track selection
    setAudioTrack: (trackIndex: number) => void;
    setSubtitleTrack: (trackIndex: number | null) => void;

    // Queue navigation
    nextItem: () => void;
    prevItem: () => void;
    setRepeatMode: (mode: RepeatMode) => void;
    toggleRepeatMode: () => void;
    setShuffleMode: (mode: ShuffleMode) => void;
    toggleShuffleMode: () => void;

    // Volume control
    setVolume: (volume: number) => void;
    setMuted: (muted: boolean) => void;
    toggleMuted: () => void;

    // Progress tracking
    setProgress: (progress: PlaybackProgress) => void;
    updateProgress: (currentTime: number, duration: number) => void;
    setBuffering: (buffering: boolean) => void;

    // Stream management
    setStreamInfo: (streamInfo: StreamInfo | null) => void;
    determinePlayMethod: () => 'DirectPlay' | 'DirectStream' | 'Transcode' | null;

    // Error handling
    setError: (error: string | null) => void;
    clearError: () => void;
    setLoading: (loading: boolean) => void;

    // State reset
    reset: () => void;
}

const initialState: MediaState = {
    status: 'idle',
    currentItem: null,
    progress: {
        currentTime: 0,
        duration: 0,
        percent: 0,
        buffered: 0
    },
    repeatMode: 'RepeatNone',
    shuffleMode: 'Sorted',
    volume: 100,
    isMuted: false,
    playbackRate: 1,
    audioTrack: null,
    subtitleTrack: null,
    streamInfo: null,
    trackInfo: null,
    lastError: null,
    isLoading: false
};

export const useMediaStore = create<MediaState & MediaActions>()(
    subscribeWithSelector((set, get) => ({
        ...initialState,

        play: (item) => {
            const { currentItem, status } = get();

            if (item) {
                set({
                    currentItem: item,
                    status: 'buffering',
                    progress: { currentTime: 0, duration: 0, percent: 0, buffered: 0 }
                });
            } else if (currentItem && status === 'paused') {
                set({ status: 'playing' });
            } else if (currentItem && status === 'idle') {
                set({ status: 'buffering' });
            }
        },

        pause: () => {
            const { status } = get();

            if (status === 'playing' || status === 'buffering') {
                set({ status: 'paused' });
            }
        },

        stop: () => {
            set({
                status: 'idle',
                progress: { currentTime: 0, duration: 0, percent: 0, buffered: 0 }
            });
        },

        togglePlayPause: () => {
            const { status } = get();

            if (status === 'playing') {
                set({ status: 'paused' });
            } else if (status === 'paused' || status === 'idle') {
                set({ status: status === 'idle' ? 'buffering' : 'playing' });
            }
        },

        seek: (time: number) => {
            const { progress, status } = get();

            set({
                progress: {
                    ...progress,
                    currentTime: time,
                    percent: progress.duration > 0 ? (time / progress.duration) * 100 : 0
                }
            });
        },

        setPlaybackRate: (rate) => {
            set({ playbackRate: rate });
        },

        setAudioTrack: (trackIndex) => {
            set({ audioTrack: trackIndex });
        },

        setSubtitleTrack: (trackIndex) => {
            set({ subtitleTrack: trackIndex });
        },

        nextItem: () => {
            const { currentItem } = get();

            if (currentItem?.nextItem) {
                set({
                    currentItem: currentItem.nextItem,
                    progress: { currentTime: 0, duration: 0, percent: 0, buffered: 0 },
                    status: 'buffering'
                });
            }
        },

        prevItem: () => {
            const { currentItem } = get();

            if (currentItem?.prevItem) {
                set({
                    currentItem: currentItem.prevItem,
                    progress: { currentTime: 0, duration: 0, percent: 0, buffered: 0 },
                    status: 'buffering'
                });
            }
        },

        setRepeatMode: (mode) => {
            set({ repeatMode: mode });
        },

        toggleRepeatMode: () => {
            const { repeatMode } = get();

            const modes: RepeatMode[] = ['RepeatNone', 'RepeatAll', 'RepeatOne'];
            const currentIndex = modes.indexOf(repeatMode);
            const nextIndex = (currentIndex + 1) % modes.length;

            set({ repeatMode: modes[nextIndex] });
        },

        setShuffleMode: (mode) => {
            set({ shuffleMode: mode });
        },

        toggleShuffleMode: () => {
            const { shuffleMode } = get();

            set({
                shuffleMode: shuffleMode === 'Sorted' ? 'Shuffle' : 'Sorted'
            });
        },

        setVolume: (volume) => {
            set({ volume: Math.max(0, Math.min(100, volume)) });
        },

        setMuted: (muted) => {
            set({ isMuted: muted });
        },

        toggleMuted: () => {
            set((state) => ({ isMuted: !state.isMuted }));
        },

        setProgress: (progress) => {
            set({ progress });
        },

        updateProgress: (currentTime, duration) => {
            set({
                progress: {
                    currentTime,
                    duration,
                    percent: duration > 0 ? (currentTime / duration) * 100 : 0,
                    buffered: 0
                }
            });
        },

        setBuffering: (buffering) => {
            set({ status: buffering ? 'buffering' : 'playing' });
        },

        setStreamInfo: (streamInfo) => {
            set({ streamInfo });
        },

        determinePlayMethod: () => {
            const { currentItem, streamInfo } = get();

            if (!currentItem || !streamInfo) {
                return null;
            }

            const policyStreamInfo: PolicyStreamInfo = {
                playMethod: streamInfo.playMethod,
                bitrate: streamInfo.bitrate,
                supportsDirectPlay: streamInfo.supportsDirectPlay,
                supportedVideoTypes: streamInfo.supportedVideoTypes,
                supportedAudioTypes: streamInfo.supportedAudioTypes
            };

            const decision = shouldTranscode(currentItem.mediaType, policyStreamInfo);

            if (decision.shouldTranscode) {
                return 'Transcode';
            }

            return streamInfo.playMethod || 'DirectPlay';
        },

        setError: (error) => {
            set({
                lastError: error ? { message: error, timestamp: Date.now() } : null,
                status: error ? 'error' : 'idle'
            });
        },

        clearError: () => {
            set({ lastError: null });
        },

        setLoading: (loading) => {
            set({ isLoading: loading, status: loading ? 'buffering' : 'idle' });
        },

        reset: () => {
            set(initialState);
        }
    }))
);

// Selectors
export const selectStatus = (state: MediaState & MediaActions) => state.status;
export const selectCurrentItem = (state: MediaState & MediaActions) => state.currentItem;
export const selectProgress = (state: MediaState & MediaActions) => state.progress;
export const selectIsPlaying = (state: MediaState & MediaActions) => state.status === 'playing';
export const selectVolume = (state: MediaState & MediaActions) => state.volume;
export const selectIsMuted = (state: MediaState & MediaActions) => state.isMuted;
export const selectRepeatMode = (state: MediaState & MediaActions) => state.repeatMode;
export const selectShuffleMode = (state: MediaState & MediaActions) => state.shuffleMode;
export const selectStreamInfo = (state: MediaState & MediaActions) => state.streamInfo;
export const selectError = (state: MediaState & MediaActions) => state.lastError;
