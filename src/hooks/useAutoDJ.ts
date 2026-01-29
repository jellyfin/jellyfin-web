import {
    type FullTrackAnalysis,
    loadAutoDJAnalyzer,
    type TransitionSuggestion
} from 'components/audioAnalysis/autoDJ';
import { useCallback, useRef, useState } from 'react';
import { logger } from 'utils/logger';

interface AnalysisCache {
    features: FullTrackAnalysis;
    structure: {
        introStart: number;
        introEnd: number;
        outroStart: number;
        outroEnd: number;
        drops: number[];
        breakdowns: number[];
        buildups: number[];
        energyProfile: number[];
        sectionCount: number;
    };
    genre: {
        primaryGenre: string;
        genreConfidence: number;
    };
    analyzedAt: number;
    duration: number;
}

interface AutoDJConfig {
    minCrossfadeDuration: number;
    maxCrossfadeDuration: number;
    varietyThreshold: number;
    preferHarmonic: boolean;
    preferEnergyMatch: boolean;
    useNotchFilter: boolean;
    notchFrequency: number;
}

interface TransitionHistory {
    lastTransitionType: string;
    transitionCount: number;
    recentTransitionTypes: string[];
    harmonicMixCount: number;
    energyMixCount: number;
    tempoChangeCount: number;
    standardMixCount: number;
    varietyScore: number;
}

const DEFAULT_CONFIG: AutoDJConfig = {
    minCrossfadeDuration: 12,
    maxCrossfadeDuration: 24,
    varietyThreshold: 0.7,
    preferHarmonic: true,
    preferEnergyMatch: true,
    useNotchFilter: true,
    notchFrequency: 60
};

const DEFAULT_HISTORY: TransitionHistory = {
    lastTransitionType: 'None',
    transitionCount: 0,
    recentTransitionTypes: [],
    harmonicMixCount: 0,
    energyMixCount: 0,
    tempoChangeCount: 0,
    standardMixCount: 0,
    varietyScore: 1.0
};

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

export function useAutoDJ() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [lastError, setLastError] = useState<Error | null>(null);
    const [config, setConfig] = useState<AutoDJConfig>(DEFAULT_CONFIG);

    const analyzerRef = useRef<Awaited<ReturnType<typeof loadAutoDJAnalyzer>> | null>(null);
    const analysesRef = useRef<Map<string, AnalysisCache>>(new Map());
    const transitionHistoryRef = useRef<TransitionHistory>(DEFAULT_HISTORY);

    const initializeAnalyzer = useCallback(async () => {
        if (analyzerRef.current) return analyzerRef.current;

        try {
            const analyzer = await loadAutoDJAnalyzer();
            analyzerRef.current = analyzer;
            logger.info('AutoDJ analyzer initialized', { component: 'AutoDJ' });
            return analyzer;
        } catch (error) {
            logger.error('Failed to initialize AutoDJ analyzer', {
                component: 'AutoDJ',
                error: String(error)
            });
            throw error;
        }
    }, []);

    const getAnalysis = useCallback((trackId: string): AnalysisCache | null => {
        return analysesRef.current.get(trackId) || null;
    }, []);

    const saveAnalysis = useCallback((trackId: string, analysis: AnalysisCache) => {
        analysesRef.current.set(trackId, analysis);
        logger.debug('Saved analysis for track', { component: 'AutoDJ', trackId });
    }, []);

    const analyzeTrack = useCallback(
        async (
            trackId: string,
            audioBuffer: AudioBuffer,
            saveToCache = true
        ): Promise<FullTrackAnalysis> => {
            const module = await initializeAnalyzer();

            try {
                setIsAnalyzing(true);
                const channelData = audioBuffer.getChannelData(0);
                const analysis = module.analyzeTrack(channelData, audioBuffer.sampleRate);

                if (saveToCache) {
                    saveAnalysis(trackId, {
                        features: analysis,
                        structure: {
                            introStart: analysis.introBestStartPoint - 2,
                            introEnd: analysis.introBestStartPoint,
                            outroStart: analysis.outroBestEndPoint,
                            outroEnd: analysis.outroBestEndPoint + 4,
                            drops: [],
                            breakdowns: [],
                            buildups: [],
                            energyProfile: [],
                            sectionCount: 0
                        },
                        genre: {
                            primaryGenre: analysis.primaryGenre,
                            genreConfidence: analysis.genreConfidence
                        },
                        analyzedAt: Date.now(),
                        duration: audioBuffer.duration
                    });
                }

                return analysis;
            } catch (error) {
                setLastError(error as Error);
                throw error;
            } finally {
                setIsAnalyzing(false);
            }
        },
        [initializeAnalyzer, saveAnalysis]
    );

    const getTransition = useCallback(
        async (
            currentTrackId: string,
            _nextTrackId: string,
            nextAudioBuffer: AudioBuffer
        ): Promise<TransitionSuggestion> => {
            const module = await initializeAnalyzer();

            const currentAnalysis = getAnalysis(currentTrackId);
            const nextSamples = nextAudioBuffer.getChannelData(0);
            const nextAnalysis = module.analyzeTrack(nextSamples, nextAudioBuffer.sampleRate);

            const current = currentAnalysis?.features || createEmptyAnalysis();
            const suggestion = module.suggestTransition(current, nextAnalysis);

            if (config.useNotchFilter) {
                const adjustedSuggestion = { ...suggestion };
                if (current.bassMidRatio > 1.5 || nextAnalysis.bassMidRatio > 1.5) {
                    adjustedSuggestion.fxRecommendation =
                        suggestion.fxRecommendation +
                        (suggestion.fxRecommendation ? ', ' : '') +
                        `Notch Filter ${config.notchFrequency}Hz`;
                }
                return adjustedSuggestion;
            }

            return suggestion;
        },
        [config, getAnalysis, initializeAnalyzer]
    );

    const recordTransition = useCallback((suggestion: TransitionSuggestion) => {
        const history = transitionHistoryRef.current;

        history.recentTransitionTypes.push(suggestion.transitionType);
        if (history.recentTransitionTypes.length > 10) {
            history.recentTransitionTypes.shift();
        }

        history.transitionCount++;
        history.lastTransitionType = suggestion.transitionType;

        switch (suggestion.transitionType) {
            case 'Harmonic Mix':
                history.harmonicMixCount++;
                break;
            case 'Energy Mix':
                history.energyMixCount++;
                break;
            case 'Tempo Change':
                history.tempoChangeCount++;
                break;
            case 'Standard Crossfade':
                history.standardMixCount++;
                break;
        }

        if (history.recentTransitionTypes.length >= 3) {
            const uniqueTypes = new Set(history.recentTransitionTypes).size;
            history.varietyScore = uniqueTypes / history.recentTransitionTypes.length;
        }

        logger.info('Recorded transition', {
            component: 'AutoDJ',
            type: suggestion.transitionType,
            varietyScore: history.varietyScore
        });
    }, []);

    const updateConfig = useCallback((newConfig: Partial<AutoDJConfig>) => {
        setConfig((prev) => ({ ...prev, ...newConfig }));
        logger.info('Updated AutoDJ config', { component: 'AutoDJ', config: newConfig });
    }, []);

    const getTransitionHistory = useCallback(() => {
        return { ...transitionHistoryRef.current };
    }, []);

    return {
        analyzeTrack,
        getTransition,
        recordTransition,
        getAnalysis,
        updateConfig,
        getTransitionHistory,
        config,
        isAnalyzing,
        lastError,
        createEmptyAnalysis
    };
}
