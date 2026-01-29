import { usePreferencesStore } from 'store/preferencesStore';
import { logger } from 'utils/logger';

export interface CrossfadeEventDetail {
    crossfadeDuration: number;
    crossfadeEnabled: boolean;
    networkLatencyCompensation: number;
    networkLatencyMode: 'auto' | 'manual';
    manualLatencyOffset: number;
}

export interface VisualizerEventDetail {
    enabled: boolean;
    type: 'waveform' | 'frequency' | 'butterchurn' | 'threed';
    sensitivity: number;
    barCount: number;
    smoothing: number;
    butterchurn: {
        preset: string;
        opacity: number;
    };
    frequencyAnalyzer: {
        opacity: number;
        colorScheme: string;
    };
    waveSurfer: {
        opacity: number;
        colorScheme: string;
    };
}

export interface AutoDJEventDetail {
    enabled: boolean;
    duration: number;
    preferHarmonic: boolean;
    preferEnergyMatch: boolean;
    useNotchFilter: boolean;
    notchFrequency: number;
}

type PreferencesCategory = 'audio' | 'visualizer' | 'playback' | 'crossfade' | 'autoDJ' | 'ui';

let isInitialized = false;
let previousState: ReturnType<typeof usePreferencesStore.getState> | null = null;

function shallowCompare(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

function hasChanged(
    current: typeof previousState,
    previous: typeof previousState,
    category: PreferencesCategory
): boolean {
    if (!previous || !current) return true;
    return !shallowCompare(current[category], previous[category]);
}

export function initSettingsEventHandler(): void {
    if (isInitialized) {
        logger.warn('[SettingsEventHandler] Already initialized', {
            component: 'SettingsEventHandler'
        });
        return;
    }

    isInitialized = true;
    logger.info('[SettingsEventHandler] Initializing settings event delegation', {
        component: 'SettingsEventHandler'
    });

    usePreferencesStore.subscribe((state) => {
        if (!previousState) {
            previousState = state;
            return;
        }

        if (hasChanged(state, previousState, 'crossfade')) {
            const detail: CrossfadeEventDetail = {
                crossfadeDuration: state.crossfade.crossfadeDuration,
                crossfadeEnabled: state.crossfade.crossfadeEnabled,
                networkLatencyCompensation: state.crossfade.networkLatencyCompensation,
                networkLatencyMode: state.crossfade.networkLatencyMode,
                manualLatencyOffset: state.crossfade.manualLatencyOffset
            };
            window.dispatchEvent(new CustomEvent('preferences:crossfade', { detail }));
            logger.debug('[SettingsEventHandler] Dispatched crossfade preferences change', {
                component: 'SettingsEventHandler',
                detail
            });
        }

        if (hasChanged(state, previousState, 'visualizer')) {
            const detail: VisualizerEventDetail = {
                enabled: state.visualizer.enabled,
                type: state.visualizer.type,
                sensitivity: state.visualizer.sensitivity,
                barCount: state.visualizer.barCount,
                smoothing: state.visualizer.smoothing,
                butterchurn: {
                    preset: state.visualizer.butterchurn.preset,
                    opacity: state.visualizer.butterchurn.opacity
                },
                frequencyAnalyzer: {
                    opacity: state.visualizer.frequencyAnalyzer.opacity,
                    colorScheme: state.visualizer.frequencyAnalyzer.colorScheme
                },
                waveSurfer: {
                    opacity: state.visualizer.waveSurfer.opacity,
                    colorScheme: state.visualizer.waveSurfer.colorScheme
                }
            };
            window.dispatchEvent(new CustomEvent('preferences:visualizer', { detail }));
            logger.debug('[SettingsEventHandler] Dispatched visualizer preferences change', {
                component: 'SettingsEventHandler',
                detail
            });
        }

        if (hasChanged(state, previousState, 'autoDJ')) {
            const detail: AutoDJEventDetail = {
                enabled: state.autoDJ.enabled,
                duration: state.autoDJ.duration,
                preferHarmonic: state.autoDJ.preferHarmonic,
                preferEnergyMatch: state.autoDJ.preferEnergyMatch,
                useNotchFilter: state.autoDJ.useNotchFilter,
                notchFrequency: state.autoDJ.notchFrequency
            };
            window.dispatchEvent(new CustomEvent('preferences:autoDJ', { detail }));
            logger.debug('[SettingsEventHandler] Dispatched autoDJ preferences change', {
                component: 'SettingsEventHandler',
                detail
            });
        }

        if (hasChanged(state, previousState, 'audio')) {
            window.dispatchEvent(
                new CustomEvent('preferences:audio', {
                    detail: {
                        volume: state.audio.volume,
                        muted: state.audio.muted,
                        makeupGain: state.audio.makeupGain,
                        enableNormalization: state.audio.enableNormalization,
                        normalizationPercent: state.audio.normalizationPercent
                    }
                })
            );
            logger.debug('[SettingsEventHandler] Dispatched audio preferences change', {
                component: 'SettingsEventHandler'
            });
        }

        if (hasChanged(state, previousState, 'playback')) {
            window.dispatchEvent(
                new CustomEvent('preferences:playback', { detail: state.playback })
            );
            logger.debug('[SettingsEventHandler] Dispatched playback preferences change', {
                component: 'SettingsEventHandler'
            });
        }

        if (hasChanged(state, previousState, 'ui')) {
            window.dispatchEvent(new CustomEvent('preferences:ui', { detail: state.ui }));
            logger.debug('[SettingsEventHandler] Dispatched UI preferences change', {
                component: 'SettingsEventHandler'
            });
        }

        previousState = state;
    });
}

export function subscribeToPreferences<K extends string>(
    eventType: K,
    handler: (event: CustomEvent) => void
): () => void {
    const listener = handler as EventListener;
    window.addEventListener(eventType, listener);
    return () => {
        window.removeEventListener(eventType, listener);
    };
}

export function dispatchPreferencesUpdate(): void {
    const state = usePreferencesStore.getState();
    window.dispatchEvent(new CustomEvent('preferences:full', { detail: state }));
    logger.debug('[SettingsEventHandler] Dispatched full preferences state', {
        component: 'SettingsEventHandler'
    });
}

export function getCurrentPreferences(): ReturnType<typeof usePreferencesStore.getState> {
    return usePreferencesStore.getState();
}

export function getCrossfadePreferences(): CrossfadeEventDetail {
    const state = usePreferencesStore.getState();
    return {
        crossfadeDuration: state.crossfade.crossfadeDuration,
        crossfadeEnabled: state.crossfade.crossfadeEnabled,
        networkLatencyCompensation: state.crossfade.networkLatencyCompensation,
        networkLatencyMode: state.crossfade.networkLatencyMode,
        manualLatencyOffset: state.crossfade.manualLatencyOffset
    };
}

export function getVisualizerPreferences(): VisualizerEventDetail {
    const state = usePreferencesStore.getState();
    return {
        enabled: state.visualizer.enabled,
        type: state.visualizer.type,
        sensitivity: state.visualizer.sensitivity,
        barCount: state.visualizer.barCount,
        smoothing: state.visualizer.smoothing,
        butterchurn: {
            preset: state.visualizer.butterchurn.preset,
            opacity: state.visualizer.butterchurn.opacity
        },
        frequencyAnalyzer: {
            opacity: state.visualizer.frequencyAnalyzer.opacity,
            colorScheme: state.visualizer.frequencyAnalyzer.colorScheme
        },
        waveSurfer: {
            opacity: state.visualizer.waveSurfer.opacity,
            colorScheme: state.visualizer.waveSurfer.colorScheme
        }
    };
}

export function getAutoDJPreferences(): AutoDJEventDetail {
    const state = usePreferencesStore.getState();
    return {
        enabled: state.autoDJ.enabled,
        duration: state.autoDJ.duration,
        preferHarmonic: state.autoDJ.preferHarmonic,
        preferEnergyMatch: state.autoDJ.preferEnergyMatch,
        useNotchFilter: state.autoDJ.useNotchFilter,
        notchFrequency: state.autoDJ.notchFrequency
    };
}
