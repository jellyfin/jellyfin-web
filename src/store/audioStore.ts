import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface Track {
    id: string;
    name: string;
    artist?: string;
    imageUrl?: string;
    runtimeTicks?: number; // Jellyfin uses ticks
}

interface AudioState {
    // Audio Engine State
    volume: number;
    muted: boolean;
    makeupGain: number;
    isReady: boolean;
    
    // Playback State
    isPlaying: boolean;
    currentTrack: Track | null;
    currentTime: number; // in seconds
    duration: number; // in seconds

    // Actions
    setVolume: (volume: number) => void;
    setMuted: (muted: boolean) => void;
    setMakeupGain: (gain: number) => void;
    setIsReady: (isReady: boolean) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setCurrentTrack: (track: Track | null) => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
}

export const useAudioStore = create<AudioState>()(
    subscribeWithSelector((set) => ({
        volume: 100,
        muted: false,
        makeupGain: 1,
        isReady: false,
        
        isPlaying: false,
        currentTrack: null,
        currentTime: 0,
        duration: 0,

        setVolume: (volume) => set({ volume }),
        setMuted: (muted) => set({ muted }),
        setMakeupGain: (makeupGain) => set({ makeupGain }),
        setIsReady: (isReady) => set({ isReady }),
        setIsPlaying: (isPlaying) => set({ isPlaying }),
        setCurrentTrack: (currentTrack) => set({ currentTrack }),
        setCurrentTime: (currentTime) => set({ currentTime }),
        setDuration: (duration) => set({ duration }),
    }))
);
