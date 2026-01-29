/**
 * Auto-DJ Store
 *
 * Manages Auto-DJ state, transitions, and playback integration.
 * Persists configuration and transition history.
 */

import { type FullTrackAnalysis, type TransitionSuggestion } from 'components/audioAnalysis';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AutoDJState {
    enabled: boolean;
    currentTransition: TransitionSuggestion | null;
    transitionHistory: TransitionRecord[];
    autoAdvanceEnabled: boolean;
    crossfadeDuration: number;
    preferHarmonic: boolean;
    preferEnergyMatch: boolean;
    useNotchFilter: boolean;
    notchFrequency: number;
    lastAnalyzedTrackId: string | null;
    analysisProgress: number;

    setEnabled: (enabled: boolean) => void;
    setCurrentTransition: (transition: TransitionSuggestion | null) => void;
    recordTransition: (trackId: string, transition: TransitionSuggestion) => void;
    setAutoAdvanceEnabled: (enabled: boolean) => void;
    setCrossfadeDuration: (duration: number) => void;
    setPreferHarmonic: (prefer: boolean) => void;
    setPreferEnergyMatch: (prefer: boolean) => void;
    setUseNotchFilter: (use: boolean) => void;
    setNotchFrequency: (freq: number) => void;
    setLastAnalyzedTrackId: (trackId: string | null) => void;
    setAnalysisProgress: (progress: number) => void;
    clearTransition: () => void;
    getTransitionStats: () => TransitionStats;
}

export interface TransitionRecord {
    trackId: string;
    timestamp: number;
    transitionType: string;
    compatibilityScore: number;
    fxApplied: string[];
}

export interface TransitionStats {
    totalTransitions: number;
    harmonicMixes: number;
    energyMixes: number;
    tempoChanges: number;
    standardMixes: number;
    averageCompatibility: number;
    varietyScore: number;
}

const DEFAULT_STATE = {
    enabled: false,
    currentTransition: null,
    transitionHistory: [],
    autoAdvanceEnabled: true,
    crossfadeDuration: 16,
    preferHarmonic: true,
    preferEnergyMatch: true,
    useNotchFilter: true,
    notchFrequency: 60,
    lastAnalyzedTrackId: null,
    analysisProgress: 0
};

export const useAutoDJStore = create<AutoDJState>()(
    persist(
        (set, get) => ({
            ...DEFAULT_STATE,

            setEnabled: (enabled) => {
                set({ enabled });
            },

            setCurrentTransition: (transition) => {
                set({ currentTransition: transition });
            },

            recordTransition: (trackId, transition) => {
                const record: TransitionRecord = {
                    trackId,
                    timestamp: Date.now(),
                    transitionType: transition.transitionType,
                    compatibilityScore: transition.compatibilityScore,
                    fxApplied: transition.fxRecommendation
                        ? transition.fxRecommendation.split(', ')
                        : []
                };

                set((state) => ({
                    transitionHistory: [record, ...state.transitionHistory].slice(0, 100),
                    currentTransition: null
                }));
            },

            setAutoAdvanceEnabled: (enabled) => {
                set({ autoAdvanceEnabled: enabled });
            },

            setCrossfadeDuration: (duration) => {
                set({ crossfadeDuration: duration });
            },

            setPreferHarmonic: (prefer) => {
                set({ preferHarmonic: prefer });
            },

            setPreferEnergyMatch: (prefer) => {
                set({ preferEnergyMatch: prefer });
            },

            setUseNotchFilter: (use) => {
                set({ useNotchFilter: use });
            },

            setNotchFrequency: (freq) => {
                set({ notchFrequency: freq });
            },

            setLastAnalyzedTrackId: (trackId) => {
                set({ lastAnalyzedTrackId: trackId });
            },

            setAnalysisProgress: (progress) => {
                set({ analysisProgress: progress });
            },

            clearTransition: () => {
                set({ currentTransition: null });
            },

            getTransitionStats: () => {
                const history = get().transitionHistory;
                if (history.length === 0) {
                    return {
                        totalTransitions: 0,
                        harmonicMixes: 0,
                        energyMixes: 0,
                        tempoChanges: 0,
                        standardMixes: 0,
                        averageCompatibility: 0,
                        varietyScore: 1.0
                    };
                }

                const harmonicMixes = history.filter(
                    (r) => r.transitionType === 'Harmonic Mix'
                ).length;
                const energyMixes = history.filter((r) => r.transitionType === 'Energy Mix').length;
                const tempoChanges = history.filter(
                    (r) => r.transitionType === 'Tempo Change'
                ).length;
                const standardMixes = history.filter(
                    (r) => r.transitionType === 'Standard Crossfade'
                ).length;
                const avgCompatibility =
                    history.reduce((sum, r) => sum + r.compatibilityScore, 0) / history.length;

                const recentTypes = history.slice(0, 10).map((r) => r.transitionType);
                const uniqueTypes = new Set(recentTypes).size;
                const varietyScore =
                    recentTypes.length > 0 ? uniqueTypes / recentTypes.length : 1.0;

                return {
                    totalTransitions: history.length,
                    harmonicMixes,
                    energyMixes,
                    tempoChanges,
                    standardMixes,
                    averageCompatibility: avgCompatibility,
                    varietyScore
                };
            }
        }),
        {
            name: 'jellyfin-autodj-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                enabled: state.enabled,
                autoAdvanceEnabled: state.autoAdvanceEnabled,
                crossfadeDuration: state.crossfadeDuration,
                preferHarmonic: state.preferHarmonic,
                preferEnergyMatch: state.preferEnergyMatch,
                useNotchFilter: state.useNotchFilter,
                notchFrequency: state.notchFrequency,
                transitionHistory: state.transitionHistory.slice(0, 50)
            })
        }
    )
);

export default useAutoDJStore;
