/**
 * useAudioAnalysis - Hook for audio track analysis
 *
 * Provides easy access to audio analysis functionality with caching.
 *
 * Usage:
 * ```typescript
 * const { analyze, getAnalysis, getCompatibleTracks } = useAudioAnalysis();
 * const result = await analyze(trackId, audioBuffer);
 * ```
 */

import { useCallback, useRef, useState } from 'react';
import { loadAudioAnalyzer, AudioAnalysisResult, AudioFeatures, TransitionSuggestion } from 'components/audioAnalysis';
import { useAnalysisStore, TrackAnalysis } from 'store/analysisStore';

interface UseAudioAnalysisReturn {
    analyze: (trackId: string, audioBuffer: AudioBuffer) => Promise<AudioAnalysisResult>;
    analyzeFromSamples: (
        trackId: string,
        samples: Float32Array,
        sampleRate: number,
        duration: number
    ) => Promise<AudioAnalysisResult>;
    getAnalysis: (trackId: string) => TrackAnalysis | null;
    getTransition: (currentTrackId: string, nextTrackId: string) => TransitionSuggestion | null;
    getCompatibleTracks: (trackId: string, limit?: number) => string[];
    isAnalyzing: boolean;
    lastError: Error | null;
    analyzeNextTrack: (
        currentTrackId: string,
        nextTrackId: string,
        nextAudioBuffer: AudioBuffer
    ) => Promise<TransitionSuggestion>;
}

interface WasmFeatures {
    bpm: number;
    bpm_confidence: number;
    key: string;
    key_confidence: number;
    camelot_key: string;
    energy: number;
    loudness: number;
    spectral_centroid: number;
    spectral_rolloff: number;
    spectral_flux: number;
    zero_crossing_rate: number;
    rms_energy: number;
    peak_frequency: number;
    dynamic_range: number;
    attack_time: number;
    decay_time: number;
    brightness: number;
    warmth: number;
    roughness: number;
}

interface WasmStructure {
    intro_start: number;
    intro_end: number;
    outro_start: number;
    outro_end: number;
    drops: number[];
    breakdowns: number[];
    buildups: number[];
    energy_profile: number[];
    section_count: number;
}

interface WasmAnalyzer {
    AudioAnalyzer: new (fftSize?: number) => {
        analyze(samples: Float32Array, sampleRate: number): WasmFeatures;
        analyzeStructure(samples: Float32Array, sampleRate: number, features: WasmFeatures): WasmStructure;
        classifyGenre(features: WasmFeatures): {
            primary_genre: string;
            genre_confidence: number;
            genre_scores: number[];
            sub_genres: string[];
        };
        suggestTransition(
            current: WasmFeatures,
            next: WasmFeatures,
            structure: WasmStructure
        ): {
            transition_type: string;
            compatibility_score: number;
            recommended_duration: number;
            harmonic_compatibility: number;
            energy_match: number;
            bpm_diff: number;
            notes: string;
        };
        version(): string;
        info(): string;
    };
    analyzeAudio(
        samples: Float32Array,
        sampleRate: number,
        nextTrackSamples?: Float32Array | null
    ): AudioAnalysisResult;
}

function convertWasmFeatures(features: WasmFeatures): AudioFeatures {
    return {
        bpm: features.bpm,
        bpmConfidence: features.bpm_confidence,
        key: features.key,
        keyConfidence: features.key_confidence,
        camelotKey: features.camelot_key,
        energy: features.energy,
        loudness: features.loudness,
        spectralCentroid: features.spectral_centroid,
        spectralRolloff: features.spectral_rolloff,
        spectralFlux: features.spectral_flux,
        zeroCrossingRate: features.zero_crossing_rate,
        rmsEnergy: features.rms_energy,
        peakFrequency: features.peak_frequency,
        dynamicRange: features.dynamic_range,
        attackTime: features.attack_time,
        decayTime: features.decay_time,
        brightness: features.brightness,
        warmth: features.warmth,
        roughness: features.roughness
    };
}

function convertWasmStructure(structure: WasmStructure) {
    return {
        introStart: structure.intro_start,
        introEnd: structure.intro_end,
        outroStart: structure.outro_start,
        outroEnd: structure.outro_end,
        drops: structure.drops,
        breakdowns: structure.breakdowns,
        buildups: structure.buildups,
        energyProfile: structure.energy_profile,
        sectionCount: structure.section_count
    };
}

function convertWasmGenre(genre: {
    primary_genre: string;
    genre_confidence: number;
    genre_scores: number[];
    sub_genres: string[];
}) {
    return {
        primaryGenre: genre.primary_genre,
        genreConfidence: genre.genre_confidence,
        genreScores: genre.genre_scores,
        subGenres: genre.sub_genres
    };
}

export function useAudioAnalysis(): UseAudioAnalysisReturn {
    const analyzerRef = useRef<WasmAnalyzer | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [lastError, setLastError] = useState<Error | null>(null);

    const {
        saveAnalysis,
        getAnalysis,
        getTransitionSuggestion,
        saveTransitionCandidate,
        getCompatibleTracks: getCompatible
    } = useAnalysisStore();

    const initializeAnalyzer = useCallback(async () => {
        if (analyzerRef.current) return analyzerRef.current;

        const module = (await loadAudioAnalyzer()) as unknown as WasmAnalyzer;
        analyzerRef.current = module;
        return analyzerRef.current;
    }, []);

    const analyzeFromSamples = useCallback(
        async (
            trackId: string,
            samples: Float32Array,
            sampleRate: number,
            duration: number
        ): Promise<AudioAnalysisResult> => {
            setIsAnalyzing(true);
            setLastError(null);

            try {
                const module = await initializeAnalyzer();
                const analyzer = new module.AudioAnalyzer(2048);

                const features = analyzer.analyze(samples, sampleRate);
                const structure = analyzer.analyzeStructure(samples, sampleRate, features);
                const genre = analyzer.classifyGenre(features);

                const result: AudioAnalysisResult = {
                    features: convertWasmFeatures(features),
                    structure: convertWasmStructure(structure),
                    genre: convertWasmGenre(genre),
                    transition: null
                };

                saveAnalysis(trackId, {
                    features: result.features,
                    structure: result.structure,
                    genre: result.genre,
                    analyzedAt: Date.now(),
                    duration
                });

                return result;
            } catch (error) {
                setLastError(error as Error);
                throw error;
            } finally {
                setIsAnalyzing(false);
            }
        },
        [initializeAnalyzer, saveAnalysis]
    );

    const analyze = useCallback(
        async (trackId: string, audioBuffer: AudioBuffer): Promise<AudioAnalysisResult> => {
            const channelData = audioBuffer.getChannelData(0);
            return analyzeFromSamples(trackId, channelData, audioBuffer.sampleRate, audioBuffer.duration);
        },
        [analyzeFromSamples]
    );

    const analyzeNextTrack = useCallback(
        async (
            currentTrackId: string,
            nextTrackId: string,
            nextAudioBuffer: AudioBuffer
        ): Promise<TransitionSuggestion> => {
            const module = await initializeAnalyzer();
            const analyzer = new module.AudioAnalyzer(2048);

            const currentAnalysis = getAnalysis(currentTrackId);
            const nextSamples = nextAudioBuffer.getChannelData(0);

            const currentFeatures = currentAnalysis?.features
                ? {
                      bpm: currentAnalysis.features.bpm,
                      bpm_confidence: currentAnalysis.features.bpmConfidence,
                      key: currentAnalysis.features.key,
                      key_confidence: currentAnalysis.features.keyConfidence,
                      camelot_key: currentAnalysis.features.camelotKey,
                      energy: currentAnalysis.features.energy,
                      loudness: currentAnalysis.features.loudness,
                      spectral_centroid: currentAnalysis.features.spectralCentroid,
                      spectral_rolloff: currentAnalysis.features.spectralRolloff,
                      spectral_flux: currentAnalysis.features.spectralFlux,
                      zero_crossing_rate: currentAnalysis.features.zeroCrossingRate,
                      rms_energy: currentAnalysis.features.rmsEnergy,
                      peak_frequency: currentAnalysis.features.peakFrequency,
                      dynamic_range: currentAnalysis.features.dynamicRange,
                      attack_time: currentAnalysis.features.attackTime,
                      decay_time: currentAnalysis.features.decayTime,
                      brightness: currentAnalysis.features.brightness,
                      warmth: currentAnalysis.features.warmth,
                      roughness: currentAnalysis.features.roughness
                  }
                : {
                      bpm: 120,
                      bpm_confidence: 0.5,
                      key: 'C Major',
                      key_confidence: 0.5,
                      camelot_key: '8B',
                      energy: 0.5,
                      loudness: -20,
                      spectral_centroid: 2000,
                      spectral_rolloff: 8000,
                      spectral_flux: 0.1,
                      zero_crossing_rate: 0.05,
                      rms_energy: 0.1,
                      peak_frequency: 440,
                      dynamic_range: 20,
                      attack_time: 0.1,
                      decay_time: 0.5,
                      brightness: 0.2,
                      warmth: 0.5,
                      roughness: 0.3
                  };

            const nextFeatures = analyzer.analyze(nextSamples, nextAudioBuffer.sampleRate);
            const nextStructure = analyzer.analyzeStructure(nextSamples, nextAudioBuffer.sampleRate, nextFeatures);

            const currentStructure = currentAnalysis?.structure
                ? {
                      intro_start: currentAnalysis.structure.introStart,
                      intro_end: currentAnalysis.structure.introEnd,
                      outro_start: currentAnalysis.structure.outroStart,
                      outro_end: currentAnalysis.structure.outroEnd,
                      drops: currentAnalysis.structure.drops,
                      breakdowns: currentAnalysis.structure.breakdowns,
                      buildups: currentAnalysis.structure.buildups,
                      energy_profile: currentAnalysis.structure.energyProfile,
                      section_count: currentAnalysis.structure.sectionCount
                  }
                : {
                      intro_start: 0,
                      intro_end: 30,
                      outro_start: 270,
                      outro_end: 300,
                      drops: [],
                      breakdowns: [],
                      buildups: [],
                      energy_profile: [],
                      section_count: 3
                  };

            const suggestion = analyzer.suggestTransition(currentFeatures, nextFeatures, nextStructure);

            const transition: TransitionSuggestion = {
                transitionType: suggestion.transition_type,
                compatibilityScore: suggestion.compatibility_score,
                energyMatch: suggestion.energy_match,
                harmonicCompatibility: suggestion.harmonic_compatibility,
                mixInPoint: 0,
                mixOutPoint: 0,
                crossfadeDuration: suggestion.recommended_duration || 16,
                fxRecommendation: suggestion.notes || 'Light Reverb'
            };

            saveTransitionCandidate({
                currentTrackId,
                nextTrackId,
                suggestion: transition,
                matchScore: transition.compatibilityScore
            });

            return transition;
        },
        [initializeAnalyzer, getAnalysis, saveTransitionCandidate]
    );

    const getTransition = useCallback(
        (currentTrackId: string, nextTrackId: string) => {
            return getTransitionSuggestion(currentTrackId, nextTrackId);
        },
        [getTransitionSuggestion]
    );

    const getCompatibleTracks = useCallback(
        (trackId: string, limit?: number) => {
            return getCompatible(trackId, limit);
        },
        [getCompatible]
    );

    return {
        analyze,
        analyzeFromSamples,
        getAnalysis,
        getTransition,
        getCompatibleTracks,
        isAnalyzing,
        lastError,
        analyzeNextTrack
    };
}

export default useAudioAnalysis;
