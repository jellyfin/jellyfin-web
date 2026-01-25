/**
 * useAutoDJPlayback Hook
 *
 * Integration hook for Auto-DJ playback control.
 * Provides methods to analyze and execute transitions.
 */

import { useCallback, useRef, useState } from 'react';
import { logger } from 'utils/logger';
import { loadAutoDJAnalyzer, type FullTrackAnalysis, type TransitionSuggestion } from 'components/audioAnalysis/autoDJ';

interface TransitionRecord {
    trackId: string;
    timestamp: number;
    transitionType: string;
    compatibilityScore: number;
    fxApplied: string[];
}

export function useAutoDJPlayback() {
    const [enabled, setEnabled] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentTransition, setCurrentTransition] = useState<TransitionSuggestion | null>(null);
    const [crossfadeDuration, setCrossfadeDuration] = useState(16);
    const [transitionHistory, setTransitionHistory] = useState<TransitionRecord[]>([]);

    const wrappedModuleRef = useRef<Awaited<ReturnType<typeof loadAutoDJAnalyzer>> | null>(null);
    const transitionInProgress = useRef(false);
    const analyzedTracks = useRef<Set<string>>(new Set());

    const initializeAnalyzer = useCallback(async () => {
        if (wrappedModuleRef.current) return wrappedModuleRef.current;

        try {
            const analyzer = await loadAutoDJAnalyzer();
            wrappedModuleRef.current = analyzer;
            logger.info('AutoDJ playback analyzer initialized', { component: 'AutoDJPlayback' });
            return analyzer;
        } catch (error) {
            logger.error('Failed to initialize AutoDJ analyzer', { component: 'AutoDJPlayback', error: String(error) });
            throw error;
        }
    }, []);

    const analyzeTransition = useCallback(
        async (
            _currentTrackId: string,
            nextTrackId: string,
            nextAudioBuffer: AudioBuffer
        ): Promise<TransitionSuggestion | null> => {
            if (transitionInProgress.current) {
                return null;
            }

            if (analyzedTracks.current.has(nextTrackId)) {
                return null;
            }

            try {
                transitionInProgress.current = true;
                setIsAnalyzing(true);

                const module = await initializeAnalyzer();
                const nextSamples = nextAudioBuffer.getChannelData(0);

                const suggestion = await module.suggestTransition(
                    createEmptyAnalysis(),
                    module.analyzeTrack(nextSamples, nextAudioBuffer.sampleRate)
                );

                analyzedTracks.current.add(nextTrackId);

                logger.info('Auto-DJ transition analyzed', {
                    component: 'AutoDJPlayback',
                    transitionType: suggestion.transitionType,
                    compatibility: suggestion.compatibilityScore
                });

                setCurrentTransition(suggestion);

                return suggestion;
            } catch (error) {
                logger.error('Transition analysis failed', { component: 'AutoDJPlayback', error: String(error) });
                return null;
            } finally {
                transitionInProgress.current = false;
                setIsAnalyzing(false);
            }
        },
        [initializeAnalyzer]
    );

    const executeTransition = useCallback(
        async (currentTrackId: string, _nextTrackId: string): Promise<boolean> => {
            if (!currentTransition) {
                return false;
            }

            try {
                logger.info('Executing Auto-DJ transition', {
                    component: 'AutoDJPlayback',
                    type: currentTransition.transitionType,
                    crossfade: currentTransition.crossfadeDuration || crossfadeDuration
                });

                const record: TransitionRecord = {
                    trackId: currentTrackId,
                    timestamp: Date.now(),
                    transitionType: currentTransition.transitionType,
                    compatibilityScore: currentTransition.compatibilityScore,
                    fxApplied: currentTransition.fxRecommendation?.split(', ') || []
                };

                setTransitionHistory(prev => [record, ...prev].slice(0, 100));
                setCurrentTransition(null);

                logger.info('Auto-DJ transition executed', { component: 'AutoDJPlayback' });
                return true;
            } catch (error) {
                logger.error('Transition execution failed', { component: 'AutoDJPlayback', error: String(error) });
                setCurrentTransition(null);
                return false;
            }
        },
        [currentTransition, crossfadeDuration]
    );

    const skipTransition = useCallback(() => {
        setCurrentTransition(null);
    }, []);

    const getStats = useCallback(() => {
        const history = transitionHistory;
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

        const harmonicMixes = history.filter(r => r.transitionType === 'Harmonic Mix').length;
        const energyMixes = history.filter(r => r.transitionType === 'Energy Mix').length;
        const tempoChanges = history.filter(r => r.transitionType === 'Tempo Change').length;
        const standardMixes = history.filter(r => r.transitionType === 'Standard Crossfade').length;
        const avgCompatibility = history.reduce((sum, r) => sum + r.compatibilityScore, 0) / history.length;

        const recentTypes = history.slice(0, 10).map(r => r.transitionType);
        const uniqueTypes = new Set(recentTypes).size;
        const varietyScore = recentTypes.length > 0 ? uniqueTypes / recentTypes.length : 1.0;

        return {
            totalTransitions: history.length,
            harmonicMixes,
            energyMixes,
            tempoChanges,
            standardMixes,
            averageCompatibility: avgCompatibility,
            varietyScore
        };
    }, [transitionHistory]);

    return {
        enabled,
        setEnabled,
        isAnalyzing,
        currentTransition,
        crossfadeDuration,
        setCrossfadeDuration,
        analyzeTransition,
        executeTransition,
        skipTransition,
        getStats,
        isTransitioning: transitionInProgress.current
    };
}

function createEmptyAnalysis(): FullTrackAnalysis {
    return {
        bpm: 128,
        bpmConfidence: 0.5,
        key: 'C Major',
        keyConfidence: 0.5,
        camelotKey: '8B',
        energy: 0.3,
        loudness: -20,
        spectralCentroid: 2000,
        spectralRolloff: 8000,
        spectralFlux: 0.1,
        zeroCrossingRate: 0.05,
        rmsEnergy: 0.3,
        peakFrequency: 440,
        dynamicRange: 20,
        brightness: 0.2,
        warmth: 0.5,
        roughness: 0.3,
        bassMean: 0.3,
        bassPeak: 0.5,
        bassEnergy: 1000,
        midMean: 0.25,
        midPeak: 0.4,
        midEnergy: 800,
        highMean: 0.2,
        highPeak: 0.35,
        highEnergy: 500,
        bassMidRatio: 1.2,
        midHighRatio: 1.25,
        overallBalance: 0.25,
        introBestStartPoint: 5.0,
        introConfidence: 0.6,
        introHasSilence: false,
        introEnergyBuildup: 0.05,
        outroBestEndPoint: 180,
        outroConfidence: 0.5,
        outroEnergyDecay: 0.05,
        overallMomentum: 0.3,
        averageEnergy: 0.3,
        peakEnergy: 0.6,
        valleyEnergy: 0.1,
        energyVariance: 0.05,
        mixInPoint: 7.0,
        mixOutPoint: 176,
        mixInConfidence: 0.6,
        mixOutConfidence: 0.5,
        energyMatchIn: 0.7,
        energyMatchOut: 0.7,
        crossfadeDuration: 16,
        primaryGenre: 'House',
        genreConfidence: 0.5
    };
}

export default useAutoDJPlayback;
