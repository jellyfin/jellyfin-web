/**
 * Crossfade Store - Audio Engine Crossfade State
 *
 * Zustand store that mirrors crossfade state from preferencesStore.
 * Now delegates to preferencesStore as the source of truth.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
    getCrossfadeFadeOut,
    isCrossfadeActive,
    isCrossfadeEnabled,
    usePreferencesStore
} from './preferencesStore';

interface CrossfadeState {
    enabled: boolean;
    duration: number;
    fadeOut: number;
    sustain: number;
    busy: boolean;
    triggered: boolean;
    manualTrigger: boolean;
    lastDuration: number;
}

interface CrossfadeActions {
    syncFromEngine: () => void;
    setDuration: (duration: number) => void;
    setEnabled: (enabled: boolean) => void;
}

function getEngineState() {
    const storeState = usePreferencesStore.getState();
    const duration = storeState.crossfade.crossfadeDuration;
    const fadeOut = getCrossfadeFadeOut(duration);

    return {
        duration,
        enabled: storeState.crossfade.crossfadeEnabled,
        fadeOut,
        sustain: duration < 0.01 ? 0 : duration < 0.51 ? duration / 2 : duration / 12,
        busy: isCrossfadeActive(),
        triggered: storeState._runtime.triggered,
        manualTrigger: storeState._runtime.manualTrigger
    };
}

export const useCrossfadeStore = create<CrossfadeState & CrossfadeActions>()(
    subscribeWithSelector((set, get) => ({
        ...getEngineState(),
        lastDuration: Math.max(1, usePreferencesStore.getState().crossfade.crossfadeDuration || 5),

        syncFromEngine: () => {
            const engine = getEngineState();
            set((state) => ({
                ...state,
                ...engine,
                lastDuration: engine.duration > 0 ? engine.duration : state.lastDuration
            }));
        },

        setDuration: (duration) => {
            const clamped = Math.max(0, Math.min(30, duration));
            usePreferencesStore.getState().setCrossfadeDuration(clamped);
            const engine = getEngineState();
            set((state) => ({
                ...state,
                ...engine,
                lastDuration: clamped > 0 ? clamped : state.lastDuration
            }));
        },

        setEnabled: (enabled) => {
            const { lastDuration } = get();
            const nextDuration = enabled ? Math.max(1, lastDuration || 5) : 0;
            usePreferencesStore.getState().setCrossfadeEnabled(enabled);
            const engine = getEngineState();
            set((state) => ({
                ...state,
                ...engine,
                lastDuration: nextDuration > 0 ? nextDuration : state.lastDuration
            }));
        }
    }))
);
