/**
 * Preferences Store - User Settings and Persistence
 *
 * Zustand store for managing user preferences with localStorage persistence.
 * Handles audio, visualizer, playback, crossfade, autoDJ, and UI settings.
 */

import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';

export interface AudioPreferences {
    volume: number;
    muted: boolean;
    makeupGain: number;
    enableNormalization: boolean;
    normalizationPercent: number;
}

export interface VisualizerPreferences {
    enabled: boolean;
    type: 'waveform' | 'frequency' | 'butterchurn' | 'threed';
    // Global settings
    sensitivity: number;
    barCount: number;
    smoothing: number;
    // Frequency Analyzer specific
    frequencyAnalyzer: {
        opacity: number;
        colorScheme: 'spectrum' | 'solid' | 'albumArt' | 'gradient';
        colors: {
            solid: string;
            gradient: {
                low: string;
                mid: string;
                high: string;
            };
        };
    };
    // Waveform/WaveSurfer specific
    waveSurfer: {
        opacity: number;
        colorScheme: 'albumArt' | 'monochrome' | 'stereo';
        colors: {
            monochrome: {
                wave: string;
                cursor: string;
            };
            stereo: {
                left: string;
                right: string;
                cursor: string;
            };
        };
    };
    // Butterchurn specific
    butterchurn: {
        opacity: number;
        presetInterval: number;
        transitionSpeed: number;
        preset: string;
    };
    // 3D Visualizer specific
    threeJs: {
        renderer: 'sphere' | 'particles';
    };
    // Sitback/TV mode
    sitback: {
        trackInfoDuration: number;
        autoHideTimer: number;
    };
    // Advanced/Global
    advanced: {
        fftSize: number;
        limiterThreshold: number;
    };
}

export interface PlaybackPreferences {
    defaultPlaybackRate: number;
    autoPlay: boolean;
    rememberPlaybackPosition: boolean;
    skipForwardSeconds: number;
    skipBackSeconds: number;
    gaplessPlayback: boolean;
}

export interface CrossfadePreferences {
    crossfadeDuration: number;
    crossfadeEnabled: boolean;
    networkLatencyCompensation: number;
    networkLatencyMode: 'auto' | 'manual';
    manualLatencyOffset: number;
}

export interface TransitionRecord {
    trackId: string;
    timestamp: number;
    transitionType: string;
    compatibilityScore: number;
    fxApplied: string[];
}

export interface AutoDJPreferences {
    enabled: boolean;
    duration: number;
    preferHarmonic: boolean;
    preferEnergyMatch: boolean;
    useNotchFilter: boolean;
    notchFrequency: number;
    transitionHistory: TransitionRecord[];
}

export interface UiPreferences {
    theme: 'dark' | 'light' | 'system';
    compactMode: boolean;
    showVisualizer: boolean;
    showNowPlaying: boolean;
    animationsEnabled: boolean;
    highContrastMode: boolean;
    reducedMotion: boolean;
    brightness: number;
}

export interface CrossfadeRuntime {
    busy: boolean;
    triggered: boolean;
    manualTrigger: boolean;
}

export interface PreferencesState {
    audio: AudioPreferences;
    visualizer: VisualizerPreferences;
    playback: PlaybackPreferences;
    crossfade: CrossfadePreferences;
    autoDJ: AutoDJPreferences;
    ui: UiPreferences;
    _runtime: CrossfadeRuntime;
}

export interface PreferencesActions {
    setVolume: (volume: number) => void;
    setMuted: (muted: boolean) => void;
    setMakeupGain: (gain: number) => void;
    setEnableNormalization: (enabled: boolean) => void;
    setNormalizationPercent: (percent: number) => void;
    resetAudioSettings: () => void;

    setVisualizerEnabled: (enabled: boolean) => void;
    setVisualizerType: (type: VisualizerPreferences['type']) => void;
    setButterchurnPreset: (preset: string) => void;
    setVisualizerColorScheme: (scheme: string) => void;
    setSensitivity: (sensitivity: number) => void;
    setBarCount: (count: number) => void;
    setSmoothing: (smoothing: number) => void;
    setVisualizerOpacity: (opacity: number) => void;
    setFftSize: (size: number) => void;
    resetVisualizerSettings: () => void;

    setDefaultPlaybackRate: (rate: number) => void;
    setAutoPlay: (autoPlay: boolean) => void;
    setRememberPlaybackPosition: (remember: boolean) => void;
    setSkipForwardSeconds: (seconds: number) => void;
    setSkipBackSeconds: (seconds: number) => void;
    setGaplessPlayback: (enabled: boolean) => void;
    resetPlaybackSettings: () => void;

    setCrossfadeDuration: (duration: number) => void;
    setCrossfadeEnabled: (enabled: boolean) => void;
    setNetworkLatencyCompensation: (seconds: number) => void;
    setNetworkLatencyMode: (mode: 'auto' | 'manual') => void;
    setManualLatencyOffset: (seconds: number) => void;
    resetCrossfadeSettings: () => void;

    setAutoDJEnabled: (enabled: boolean) => void;
    setAutoDJDuration: (duration: number) => void;
    setPreferHarmonic: (prefer: boolean) => void;
    setPreferEnergyMatch: (prefer: boolean) => void;
    setUseNotchFilter: (use: boolean) => void;
    setNotchFrequency: (freq: number) => void;
    recordTransition: (
        trackId: string,
        transition: Pick<TransitionRecord, 'transitionType' | 'compatibilityScore' | 'fxApplied'>
    ) => void;
    clearTransitionHistory: () => void;
    resetAutoDJSettings: () => void;

    setTheme: (theme: UiPreferences['theme']) => void;
    setCompactMode: (compact: boolean) => void;
    setShowVisualizer: (show: boolean) => void;
    setShowNowPlaying: (show: boolean) => void;
    setAnimationsEnabled: (enabled: boolean) => void;
    setHighContrastMode: (enabled: boolean) => void;
    setBrightness: (brightness: number) => void;
    setReducedMotion: (reduced: boolean) => void;
    resetUiSettings: () => void;

    setCrossfadeBusy: (busy: boolean) => void;
    setCrossfadeTriggered: (triggered: boolean) => void;
    setCrossfadeManualTrigger: (triggered: boolean) => void;
    cancelCrossfade: () => void;
    syncCrossfadeRuntime: () => void;

    importPreferences: (prefs: Partial<PreferencesState>) => void;
    exportPreferences: () => PreferencesState;
    resetAllPreferences: () => void;
}

const defaultAudioPreferences: AudioPreferences = {
    volume: 100,
    muted: false,
    makeupGain: 1,
    enableNormalization: true,
    normalizationPercent: 95
};

const defaultVisualizerPreferences: VisualizerPreferences = {
    enabled: true,
    type: 'butterchurn',
    sensitivity: 50,
    barCount: 64,
    smoothing: 0.8,
    frequencyAnalyzer: {
        opacity: 1.0,
        colorScheme: 'spectrum',
        colors: {
            solid: '#1ED24B',
            gradient: {
                low: '#1ED24B',
                mid: '#FFD700',
                high: '#FF3232'
            }
        }
    },
    waveSurfer: {
        opacity: 0.7,
        colorScheme: 'albumArt',
        colors: {
            monochrome: {
                wave: '#1ED24B',
                cursor: '#FFFFFF'
            },
            stereo: {
                left: '#1ED24B',
                right: '#FF3232',
                cursor: '#FFFFFF'
            }
        }
    },
    butterchurn: {
        opacity: 0.6,
        presetInterval: 60,
        transitionSpeed: 2.7,
        preset: 'Good'
    },
    threeJs: {
        renderer: 'sphere'
    },
    sitback: {
        trackInfoDuration: 5,
        autoHideTimer: 5
    },
    advanced: {
        fftSize: 4096,
        limiterThreshold: -1
    }
};

const defaultPlaybackPreferences: PlaybackPreferences = {
    defaultPlaybackRate: 1,
    autoPlay: false,
    rememberPlaybackPosition: true,
    skipForwardSeconds: 10,
    skipBackSeconds: 10,
    gaplessPlayback: true
};

const defaultCrossfadePreferences: CrossfadePreferences = {
    crossfadeDuration: 5,
    crossfadeEnabled: true,
    networkLatencyCompensation: 1,
    networkLatencyMode: 'auto',
    manualLatencyOffset: 0
};

const defaultAutoDJPreferences: AutoDJPreferences = {
    enabled: false,
    duration: 16,
    preferHarmonic: true,
    preferEnergyMatch: true,
    useNotchFilter: true,
    notchFrequency: 60,
    transitionHistory: []
};

const defaultUiPreferences: UiPreferences = {
    theme: 'dark',
    compactMode: false,
    showVisualizer: true,
    showNowPlaying: true,
    animationsEnabled: true,
    highContrastMode: false,
    reducedMotion: false,
    brightness: 50
};

const defaultRuntime: CrossfadeRuntime = {
    busy: false,
    triggered: false,
    manualTrigger: false
};

const createInitialState = (): PreferencesState => ({
    audio: { ...defaultAudioPreferences },
    visualizer: { ...defaultVisualizerPreferences },
    playback: { ...defaultPlaybackPreferences },
    crossfade: { ...defaultCrossfadePreferences },
    autoDJ: { ...defaultAutoDJPreferences },
    ui: { ...defaultUiPreferences },
    _runtime: { ...defaultRuntime }
});

const PREFERENCES_STORAGE_KEY = 'jellyfin-preferences-v1';

function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const key in source) {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (
            sourceValue != null
            && typeof sourceValue === 'object'
            && !Array.isArray(sourceValue)
            && targetValue != null
            && typeof targetValue === 'object'
            && !Array.isArray(targetValue)
        ) {
            result[key as keyof T] = deepMerge(
                targetValue as Record<string, unknown>,
                sourceValue as Record<string, unknown>
            ) as T[keyof T];
        } else if (sourceValue !== undefined) {
            result[key as keyof T] = sourceValue as T[keyof T];
        }
    }
    return result;
}

function calculateSustain(duration: number): number {
    if (duration < 0.01) return 0;
    if (duration < 0.51) return duration / 2;
    return duration / 12;
}

function calculateFadeOut(duration: number): number {
    if (duration < 0.01) return 0;
    if (duration < 0.51) return duration;
    return duration * 2;
}

export const usePreferencesStore = create<PreferencesState & PreferencesActions>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                ...createInitialState(),

                setVolume: volume => {
                    set({
                        audio: { ...get().audio, volume: Math.max(0, Math.min(100, volume)) }
                    });
                },

                setMuted: muted => {
                    set({
                        audio: { ...get().audio, muted }
                    });
                },

                setMakeupGain: gain => {
                    set({
                        audio: { ...get().audio, makeupGain: Math.max(0.5, Math.min(2, gain)) }
                    });
                },

                setEnableNormalization: enabled => {
                    set({
                        audio: { ...get().audio, enableNormalization: enabled }
                    });
                },

                setNormalizationPercent: percent => {
                    set({
                        audio: { ...get().audio, normalizationPercent: Math.max(70, Math.min(100, percent)) }
                    });
                },

                resetAudioSettings: () => {
                    set({
                        audio: { ...defaultAudioPreferences }
                    });
                },

                setVisualizerEnabled: enabled => {
                    set({
                        visualizer: { ...get().visualizer, enabled }
                    });
                },

                setVisualizerType: type => {
                    set({
                        visualizer: { ...get().visualizer, type }
                    });
                },

                setButterchurnPreset: preset => {
                    set({
                        visualizer: {
                            ...get().visualizer,
                            butterchurn: { ...get().visualizer.butterchurn, preset }
                        }
                    });
                },

                setVisualizerColorScheme: scheme => {
                    const { type } = get().visualizer;
                    const visualizer = { ...get().visualizer };

                    if (type === 'frequency') {
                        visualizer.frequencyAnalyzer = {
                            ...visualizer.frequencyAnalyzer,
                            colorScheme: scheme as 'spectrum' | 'solid' | 'albumArt' | 'gradient'
                        };
                    } else if (type === 'waveform') {
                        visualizer.waveSurfer = {
                            ...visualizer.waveSurfer,
                            colorScheme: scheme as 'albumArt' | 'monochrome' | 'stereo'
                        };
                    }

                    set({ visualizer });
                },

                setSensitivity: sensitivity => {
                    set({
                        visualizer: { ...get().visualizer, sensitivity: Math.max(1, Math.min(100, sensitivity)) }
                    });
                },

                setBarCount: count => {
                    set({
                        visualizer: { ...get().visualizer, barCount: Math.max(8, Math.min(256, count)) }
                    });
                },

                setSmoothing: smoothing => {
                    set({
                        visualizer: { ...get().visualizer, smoothing: Math.max(0, Math.min(1, smoothing)) }
                    });
                },

                setVisualizerOpacity: opacity => {
                    const { type } = get().visualizer;
                    const visualizer = { ...get().visualizer };
                    const clamped = Math.max(0.1, Math.min(1.0, opacity));

                    if (type === 'frequency') {
                        visualizer.frequencyAnalyzer = { ...visualizer.frequencyAnalyzer, opacity: clamped };
                    } else if (type === 'waveform') {
                        visualizer.waveSurfer = { ...visualizer.waveSurfer, opacity: clamped };
                    } else if (type === 'butterchurn') {
                        visualizer.butterchurn = { ...visualizer.butterchurn, opacity: clamped };
                    }

                    set({ visualizer });
                },

                setFftSize: fftSize => {
                    set({
                        visualizer: {
                            ...get().visualizer,
                            advanced: { ...get().visualizer.advanced, fftSize }
                        }
                    });
                },

                resetVisualizerSettings: () => {
                    set({
                        visualizer: { ...defaultVisualizerPreferences }
                    });
                },

                setDefaultPlaybackRate: rate => {
                    const validRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
                    const closestRate = validRates.reduce((prev, curr) => {
                        return Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev;
                    }, 1);

                    set({
                        playback: { ...get().playback, defaultPlaybackRate: closestRate }
                    });
                },

                setAutoPlay: autoPlay => {
                    set({
                        playback: { ...get().playback, autoPlay }
                    });
                },

                setRememberPlaybackPosition: remember => {
                    set({
                        playback: { ...get().playback, rememberPlaybackPosition: remember }
                    });
                },

                setSkipForwardSeconds: seconds => {
                    set({
                        playback: { ...get().playback, skipForwardSeconds: Math.max(5, Math.min(120, seconds)) }
                    });
                },

                setSkipBackSeconds: seconds => {
                    set({
                        playback: { ...get().playback, skipBackSeconds: Math.max(5, Math.min(60, seconds)) }
                    });
                },

                setGaplessPlayback: enabled => {
                    set({
                        playback: { ...get().playback, gaplessPlayback: enabled }
                    });
                },

                resetPlaybackSettings: () => {
                    set({
                        playback: { ...defaultPlaybackPreferences }
                    });
                },

                setCrossfadeDuration: duration => {
                    const clamped = Math.max(0, Math.min(30, duration));
                    set({
                        crossfade: {
                            ...get().crossfade,
                            crossfadeDuration: clamped,
                            crossfadeEnabled: clamped >= 0.01
                        }
                    });
                },

                setCrossfadeEnabled: enabled => {
                    const current = get().crossfade;
                    set({
                        crossfade: {
                            ...current,
                            crossfadeEnabled: enabled,
                            crossfadeDuration: enabled ? Math.max(1, current.crossfadeDuration ?? 5) : 0
                        }
                    });
                },

                setNetworkLatencyCompensation: seconds => {
                    set({
                        crossfade: {
                            ...get().crossfade,
                            networkLatencyCompensation: Math.max(0, Math.min(10, seconds))
                        }
                    });
                },

                setNetworkLatencyMode: mode => {
                    set({
                        crossfade: { ...get().crossfade, networkLatencyMode: mode }
                    });
                },

                setManualLatencyOffset: seconds => {
                    set({
                        crossfade: {
                            ...get().crossfade,
                            manualLatencyOffset: Math.max(0, Math.min(5, seconds))
                        }
                    });
                },

                resetCrossfadeSettings: () => {
                    set({
                        crossfade: { ...defaultCrossfadePreferences },
                        _runtime: { ...defaultRuntime }
                    });
                },

                setAutoDJEnabled: enabled => {
                    set({
                        autoDJ: { ...get().autoDJ, enabled }
                    });
                },

                setAutoDJDuration: duration => {
                    set({
                        autoDJ: { ...get().autoDJ, duration: Math.max(4, Math.min(60, duration)) }
                    });
                },

                setPreferHarmonic: prefer => {
                    set({
                        autoDJ: { ...get().autoDJ, preferHarmonic: prefer }
                    });
                },

                setPreferEnergyMatch: prefer => {
                    set({
                        autoDJ: { ...get().autoDJ, preferEnergyMatch: prefer }
                    });
                },

                setUseNotchFilter: use => {
                    set({
                        autoDJ: { ...get().autoDJ, useNotchFilter: use }
                    });
                },

                setNotchFrequency: freq => {
                    set({
                        autoDJ: { ...get().autoDJ, notchFrequency: Math.max(20, Math.min(200, freq)) }
                    });
                },

                recordTransition: (trackId, transition) => {
                    const record: TransitionRecord = {
                        trackId,
                        timestamp: Date.now(),
                        transitionType: transition.transitionType,
                        compatibilityScore: transition.compatibilityScore,
                        fxApplied: transition.fxApplied ?? []
                    };

                    const currentAutoDJ = get().autoDJ;
                    set({
                        autoDJ: {
                            ...currentAutoDJ,
                            transitionHistory: [record, ...currentAutoDJ.transitionHistory].slice(0, 100)
                        }
                    });
                },

                clearTransitionHistory: () => {
                    set({
                        autoDJ: { ...get().autoDJ, transitionHistory: [] }
                    });
                },

                resetAutoDJSettings: () => {
                    set({
                        autoDJ: { ...defaultAutoDJPreferences }
                    });
                },

                setTheme: theme => {
                    set({
                        ui: { ...get().ui, theme }
                    });
                },

                setCompactMode: compact => {
                    set({
                        ui: { ...get().ui, compactMode: compact }
                    });
                },

                setShowVisualizer: show => {
                    set({
                        ui: { ...get().ui, showVisualizer: show }
                    });
                },

                setShowNowPlaying: show => {
                    set({
                        ui: { ...get().ui, showNowPlaying: show }
                    });
                },

                setAnimationsEnabled: enabled => {
                    set({
                        ui: { ...get().ui, animationsEnabled: enabled }
                    });
                },

                setHighContrastMode: enabled => {
                    set({
                        ui: { ...get().ui, highContrastMode: enabled }
                    });
                },
                setBrightness: brightness => {
                    set({
                        ui: { ...get().ui, brightness: Math.max(0, Math.min(100, brightness)) }
                    });
                },

                setReducedMotion: reduced => {
                    set({
                        ui: { ...get().ui, reducedMotion: reduced }
                    });
                },

                resetUiSettings: () => {
                    set({
                        ui: { ...defaultUiPreferences }
                    });
                },

                setCrossfadeBusy: busy => {
                    set({
                        _runtime: { ...get()._runtime, busy }
                    });
                },

                setCrossfadeTriggered: triggered => {
                    set({
                        _runtime: { ...get()._runtime, triggered }
                    });
                },

                setCrossfadeManualTrigger: triggered => {
                    set({
                        _runtime: { ...get()._runtime, manualTrigger: triggered }
                    });
                },

                cancelCrossfade: () => {
                    set({
                        _runtime: {
                            ...get()._runtime,
                            busy: false,
                            triggered: false,
                            manualTrigger: false
                        }
                    });
                },

                syncCrossfadeRuntime: () => {
                    set({
                        _runtime: { ...defaultRuntime }
                    });
                },

                importPreferences: prefs => {
                    const current = get();
                    set({
                        audio: { ...current.audio, ...(prefs.audio ?? {}) },
                        visualizer: deepMerge(current.visualizer as unknown as Record<string, unknown>, (prefs.visualizer ?? {}) as Record<string, unknown>) as unknown as VisualizerPreferences,
                        playback: { ...current.playback, ...(prefs.playback ?? {}) },
                        crossfade: { ...current.crossfade, ...(prefs.crossfade ?? {}) },
                        autoDJ: { ...current.autoDJ, ...(prefs.autoDJ ?? {}) },
                        ui: { ...current.ui, ...(prefs.ui ?? {}) }
                    });
                },

                exportPreferences: () => {
                    const state = get();
                    return {
                        audio: { ...state.audio },
                        visualizer: { ...state.visualizer },
                        playback: { ...state.playback },
                        crossfade: { ...state.crossfade },
                        autoDJ: { ...state.autoDJ },
                        ui: { ...state.ui },
                        _runtime: { ...state._runtime }
                    };
                },

                resetAllPreferences: () => {
                    set(createInitialState());
                }
            }),
            {
                name: PREFERENCES_STORAGE_KEY,
                storage: createJSONStorage(() => localStorage),
                partialize: state => ({
                    audio: state.audio,
                    visualizer: state.visualizer,
                    playback: state.playback,
                    crossfade: state.crossfade,
                    autoDJ: {
                        ...state.autoDJ,
                        transitionHistory: state.autoDJ.transitionHistory.slice(0, 50)
                    },
                    ui: state.ui
                }),
                merge: (persisted, current) => {
                    const p = persisted as Partial<PreferencesState>;
                    return {
                        ...current,
                        ...p,
                        audio: { ...current.audio, ...(p?.audio ?? {}) },
                        visualizer: deepMerge(current.visualizer as unknown as Record<string, unknown>, (p?.visualizer ?? {}) as Record<string, unknown>) as unknown as VisualizerPreferences,
                        playback: { ...current.playback, ...(p?.playback ?? {}) },
                        crossfade: { ...current.crossfade, ...(p?.crossfade ?? {}) },
                        autoDJ: { ...current.autoDJ, ...(p?.autoDJ ?? {}) },
                        ui: { ...current.ui, ...(p?.ui ?? {}) },
                        _runtime: { ...defaultRuntime }
                    };
                }
            }
        )
    )
);

export function getCrossfadeSustain(duration: number): number {
    return calculateSustain(duration);
}

export function getCrossfadeFadeOut(duration: number): number {
    return calculateFadeOut(duration);
}

export function getEffectiveLatency(): number {
    const state = usePreferencesStore.getState();
    const { networkLatencyMode, networkLatencyCompensation, manualLatencyOffset } = state.crossfade;

    if (networkLatencyMode === 'manual') {
        return manualLatencyOffset;
    }
    return networkLatencyCompensation;
}

export function getEffectiveCrossfadeDuration(): number {
    const state = usePreferencesStore.getState();
    return state.crossfade.crossfadeDuration + getEffectiveLatency();
}

export function isCrossfadeActive(): boolean {
    return usePreferencesStore.getState()._runtime.busy;
}

export function isCrossfadeEnabled(): boolean {
    return usePreferencesStore.getState().crossfade.crossfadeEnabled;
}

export function isAutoDJEnabled(): boolean {
    return usePreferencesStore.getState().autoDJ.enabled;
}

export function isVisualizerEnabled(): boolean {
    return usePreferencesStore.getState().visualizer.enabled;
}

export function getVolume(): number {
    return usePreferencesStore.getState().audio.volume;
}

export function isMuted(): boolean {
    return usePreferencesStore.getState().audio.muted;
}

export function getTheme(): UiPreferences['theme'] {
    return usePreferencesStore.getState().ui.theme;
}

export function getSkipLengths(): { forward: number; back: number } {
    const state = usePreferencesStore.getState();
    return {
        forward: state.playback.skipForwardSeconds,
        back: state.playback.skipBackSeconds
    };
}

export function getAutoPlay(): boolean {
    return usePreferencesStore.getState().playback.autoPlay;
}

export function getRememberPlaybackPosition(): boolean {
    return usePreferencesStore.getState().playback.rememberPlaybackPosition;
}

export function getNormalizationEnabled(): boolean {
    return usePreferencesStore.getState().audio.enableNormalization;
}

export function getNormalizationPercent(): number {
    return usePreferencesStore.getState().audio.normalizationPercent;
}

export function getMakeupGain(): number {
    return usePreferencesStore.getState().audio.makeupGain;
}
