import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimeStretchState {
    enabled: boolean;
    pauseDuration: number;
    resumeDuration: number;
    transitionCurve: 'linear' | 'easeInOut';
    currentTempo: number;
    isTransitioning: boolean;
    isStopped: boolean;

    setEnabled: (enabled: boolean) => void;
    setPauseDuration: (duration: number) => void;
    setResumeDuration: (duration: number) => void;
    setTransitionCurve: (curve: 'linear' | 'easeInOut') => void;
    setCurrentTempo: (tempo: number) => void;
    setIsTransitioning: (transitioning: boolean) => void;
    setIsStopped: (stopped: boolean) => void;
}

export const useTimeStretchStore = create<TimeStretchState>()(
    persist(
        set => ({
            enabled: false,
            pauseDuration: 2.0,
            resumeDuration: 0.5,
            transitionCurve: 'easeInOut',
            currentTempo: 1.0,
            isTransitioning: false,
            isStopped: false,

            setEnabled: enabled => set({ enabled }),
            setPauseDuration: pauseDuration => set({ pauseDuration: Math.max(0.1, Math.min(10, pauseDuration)) }),
            setResumeDuration: resumeDuration => set({ resumeDuration: Math.max(0.1, Math.min(5, resumeDuration)) }),
            setTransitionCurve: transitionCurve => set({ transitionCurve }),
            setCurrentTempo: currentTempo => set({ currentTempo }),
            setIsTransitioning: isTransitioning => set({ isTransitioning }),
            setIsStopped: isStopped => set({ isStopped })
        }),
        {
            name: 'jellyfin-time-stretch-store'
        }
    )
);
