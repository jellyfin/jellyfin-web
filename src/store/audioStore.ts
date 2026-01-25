/**
 * Audio Store - Audio Engine State
 *
 * Zustand store for managing audio engine state.
 * This store handles audio-specific state like volume, mute, and makeup gain.
 * It syncs with mediaStore for playback state.
 *
 * DEPRECATED: Use mediaStore for playback state and settingsStore for volume.
 * This store is kept for backward compatibility with audio engine components.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { StreamInfo } from './types';

interface Track {
    id: string;
    name: string;
    artist?: string;
    album?: string;
    albumArtist?: string;
    imageUrl?: string;
    runtimeTicks?: number;
    streamInfo?: StreamInfo;
    nextTrack?: { name: string; artist?: string; imageUrl?: string };
    prevTrack?: { name: string; artist?: string; imageUrl?: string };
}

interface AudioState {
    volume: number;
    muted: boolean;
    makeupGain: number;
    isReady: boolean;
    audioContext: AudioContext | null;
    sampleRate: number | null;

    isPlaying: boolean;
    currentTrack: Track | null;
    currentTime: number;
    duration: number;

    setVolume: (volume: number) => void;
    setMuted: (muted: boolean) => void;
    setMakeupGain: (gain: number) => void;
    setIsReady: (isReady: boolean) => void;
    setAudioContext: (ctx: AudioContext | null) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setCurrentTrack: (track: Track | null) => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;

    syncWithMediaStore: (mediaState: {
        volume: number;
        isMuted: boolean;
        isPlaying: boolean;
        progress: { currentTime: number; duration: number };
    }) => void;
}

export const useAudioStore = create<AudioState>()(
    subscribeWithSelector(set => ({
        volume: 100,
        muted: false,
        makeupGain: 1,
        isReady: false,
        audioContext: null,
        sampleRate: null,

        isPlaying: false,
        currentTrack: null,
        currentTime: 0,
        duration: 0,

        setVolume: volume => set({ volume: Math.max(0, Math.min(100, volume)) }),
        setMuted: muted => set({ muted }),
        setMakeupGain: makeupGain => set({ makeupGain: Math.max(0.5, Math.min(2, makeupGain)) }),
        setIsReady: isReady => set({ isReady }),
        setAudioContext: ctx => set({ audioContext: ctx, sampleRate: ctx?.sampleRate ?? null }),
        setIsPlaying: isPlaying => set({ isPlaying }),
        setCurrentTrack: currentTrack => set({ currentTrack }),
        setCurrentTime: currentTime => set({ currentTime }),
        setDuration: duration => set({ duration }),

        syncWithMediaStore: mediaState => {
            set({
                volume: mediaState.volume,
                muted: mediaState.isMuted,
                isPlaying: mediaState.isPlaying,
                currentTime: mediaState.progress.currentTime,
                duration: mediaState.progress.duration
            });
        }
    }))
);
