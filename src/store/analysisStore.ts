/**
 * Track Analysis Store
 *
 * Persists audio analysis results for tracks to avoid re-analyzing.
 * Uses IndexedDB via Zustand persist middleware.
 */

import {
    AudioFeatures,
    GenreClassification,
    TrackStructure,
    TransitionSuggestion
} from 'components/audioAnalysis';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface TrackAnalysis {
    trackId: string;
    features: AudioFeatures;
    structure: TrackStructure;
    genre: GenreClassification;
    analyzedAt: number;
    duration: number;
}

export interface TransitionCandidate {
    currentTrackId: string;
    nextTrackId: string;
    suggestion: TransitionSuggestion;
    matchScore: number;
}

interface AnalysisState {
    analyses: Record<string, TrackAnalysis>;
    transitionCandidates: TransitionCandidate[];

    saveAnalysis: (trackId: string, analysis: Omit<TrackAnalysis, 'trackId'>) => void;
    getAnalysis: (trackId: string) => TrackAnalysis | null;
    getTransitionSuggestion: (
        currentTrackId: string,
        nextTrackId: string
    ) => TransitionSuggestion | null;
    saveTransitionCandidate: (candidate: TransitionCandidate) => void;
    removeAnalysis: (trackId: string) => void;
    clearAll: () => void;
    getCompatibleTracks: (trackId: string, limit?: number) => string[];
}

export const useAnalysisStore = create<AnalysisState>()(
    persist(
        (set, get) => ({
            analyses: {},
            transitionCandidates: [],

            saveAnalysis: (trackId, analysis) => {
                set((state) => ({
                    analyses: {
                        ...state.analyses,
                        [trackId]: { trackId, ...analysis }
                    }
                }));
            },

            getAnalysis: (trackId) => {
                return get().analyses[trackId] || null;
            },

            getTransitionSuggestion: (currentTrackId, nextTrackId) => {
                const candidates = get().transitionCandidates;
                const candidate = candidates.find(
                    (c) => c.currentTrackId === currentTrackId && c.nextTrackId === nextTrackId
                );
                return candidate?.suggestion || null;
            },

            saveTransitionCandidate: (candidate) => {
                set((state) => {
                    const filtered = state.transitionCandidates.filter(
                        (c) =>
                            !(
                                c.currentTrackId === candidate.currentTrackId &&
                                c.nextTrackId === candidate.nextTrackId
                            )
                    );
                    return { transitionCandidates: [candidate, ...filtered].slice(0, 100) };
                });
            },

            removeAnalysis: (trackId) => {
                set((state) => {
                    const { [trackId]: _, ...rest } = state.analyses;
                    return { analyses: rest };
                });
            },

            clearAll: () => {
                set({ analyses: {}, transitionCandidates: [] });
            },

            getCompatibleTracks: (trackId, limit = 10) => {
                const current = get().analyses[trackId];
                if (!current) return [];

                const compatible: { id: string; score: number }[] = [];

                for (const [otherId, other] of Object.entries(get().analyses)) {
                    if (otherId === trackId) continue;

                    let score = 0;

                    const bpmDiff = Math.abs(other.features.bpm - current.features.bpm);
                    if (bpmDiff < 3) score += 0.4;
                    else if (bpmDiff < 5) score += 0.2;
                    else if (Math.abs(other.features.bpm - current.features.bpm) % 2 < 0.5)
                        score += 0.1;

                    if (other.features.camelotKey === current.features.camelotKey) {
                        score += 0.3;
                    }

                    const energyMatch =
                        1 - Math.abs(other.features.energy - current.features.energy);
                    score += energyMatch * 0.2;

                    if (other.genre.primaryGenre === current.genre.primaryGenre) {
                        score += 0.1;
                    }

                    compatible.push({ id: otherId, score });
                }

                return compatible
                    .sort((a, b) => b.score - a.score)
                    .slice(0, limit)
                    .map((c) => c.id);
            }
        }),
        {
            name: 'jellyfin-analysis-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                analyses: state.analyses,
                transitionCandidates: state.transitionCandidates.slice(0, 50)
            })
        }
    )
);

export default useAnalysisStore;
