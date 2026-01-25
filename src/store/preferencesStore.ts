/**
 * Preferences Store - User Settings and Persistence
 *
 * Zustand store for managing user preferences with localStorage persistence.
 * Handles audio, visualizer, playback, crossfade, autoDJ, and UI settings.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AudioPreferences {
    volume: number;
    muted: boolean;
    makeupGain: number;
    enableNormalization: boolean;
    normalizationPercent: number;
}

export interface VisualizerPreferences {
    enabled: boolean;
    type: 'waveform' | 'frequency' | 'butterchurn';
    butterchurnPreset: string;
    colorScheme: 'default' | 'vintage' | 'neon' | 'warm' | 'cool';
    sensitivity: number;
    barCount: number;
    smoothing: number;
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
    setVisualizerColorScheme: (scheme: VisualizerPreferences['colorScheme']) => void;
    setSensitivity: (sensitivity: number) => void;
    setBarCount: (count: number) => void;
    setSmoothing: (smoothing: number) => void;
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
    butterchurnPreset: 'Good',
    colorScheme: 'default',
    sensitivity: 50,
    barCount: 64,
    smoothing: 0.8
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
    reducedMotion: false
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
                    set(state => ({
                        audio: { ...state.audio, volume: Math.max(0, Math.min(100, volume)) }
                    }));
                },

                setMuted: muted => {
                    set(state => ({
                        audio: { ...state.audio, muted }
                    }));
                },

                setMakeupGain: gain => {
                    set(state => ({
                        audio: { ...state.audio, makeupGain: Math.max(0.5, Math.min(2, gain)) }
                    }));
                },

                setEnableNormalization: enabled => {
                    set(state => ({
                        audio: { ...state.audio, enableNormalization: enabled }
                    }));
                },

                setNormalizationPercent: percent => {
                    set(state => ({
                        audio: { ...state.audio, normalizationPercent: Math.max(70, Math.min(100, percent)) }
                    }));
                },

                resetAudioSettings: () => {
                    set(state => ({
                        audio: { ...defaultAudioPreferences }
                    }));
                },

                setVisualizerEnabled: enabled => {
                    set(state => ({
                        visualizer: { ...state.visualizer, enabled }
                    }));
                },

                setVisualizerType: type => {
                    set(state => ({
                        visualizer: { ...state.visualizer, type }
                    }));
                },

                setButterchurnPreset: preset => {
                    set(state => ({
                        visualizer: { ...state.visualizer, butterchurnPreset: preset }
                    }));
                },

                setVisualizerColorScheme: scheme => {
                    set(state => ({
                        visualizer: { ...state.visualizer, colorScheme: scheme }
                    }));
                },

                setSensitivity: sensitivity => {
                    set(state => ({
                        visualizer: { ...state.visualizer, sensitivity: Math.max(1, Math.min(100, sensitivity)) }
                    }));
                },

                setBarCount: count => {
                    set(state => ({
                        visualizer: { ...state.visualizer, barCount: Math.max(8, Math.min(256, count)) }
                    }));
                },

                setSmoothing: smoothing => {
                    set(state => ({
                        visualizer: { ...state.visualizer, smoothing: Math.max(0, Math.min(1, smoothing)) }
                    }));
                },

                resetVisualizerSettings: () => {
                    set(state => ({
                        visualizer: { ...defaultVisualizerPreferences }
                    }));
                },

                setDefaultPlaybackRate: rate => {
                    const validRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
                    const closestRate = validRates.reduce((prev, curr) =>
                        Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev
                    );

                    set(state => ({
                        playback: { ...state.playback, defaultPlaybackRate: closestRate }
                    }));
                },

                setAutoPlay: autoPlay => {
                    set(state => ({
                        playback: { ...state.playback, autoPlay }
                    }));
                },

                setRememberPlaybackPosition: remember => {
                    set(state => ({
                        playback: { ...state.playback, rememberPlaybackPosition: remember }
                    }));
                },

                setSkipForwardSeconds: seconds => {
                    set(state => ({
                        playback: { ...state.playback, skipForwardSeconds: Math.max(5, Math.min(120, seconds)) }
                    }));
                },

                setSkipBackSeconds: seconds => {
                    set(state => ({
                        playback: { ...state.playback, skipBackSeconds: Math.max(5, Math.min(60, seconds)) }
                    }));
                },

                setGaplessPlayback: enabled => {
                    set(state => ({
                        playback: { ...state.playback, gaplessPlayback: enabled }
                    }));
                },

                resetPlaybackSettings: () => {
                    set(state => ({
                        playback: { ...defaultPlaybackPreferences }
                    }));
                },

                setCrossfadeDuration: duration => {
                    const clamped = Math.max(0, Math.min(30, duration));
                    set(state => ({
                        crossfade: {
                            ...state.crossfade,
                            crossfadeDuration: clamped,
                            crossfadeEnabled: clamped >= 0.01
                        }
                    }));
                },

                setCrossfadeEnabled: enabled => {
                    set(state => ({
                        crossfade: {
                            ...state.crossfade,
                            crossfadeEnabled: enabled,
                            crossfadeDuration: enabled ? Math.max(1, state.crossfade.crossfadeDuration || 5) : 0
                        }
                    }));
                },

                setNetworkLatencyCompensation: seconds => {
                    set(state => ({
                        crossfade: {
                            ...state.crossfade,
                            networkLatencyCompensation: Math.max(0, Math.min(10, seconds))
                        }
                    }));
                },

                setNetworkLatencyMode: mode => {
                    set(state => ({
                        crossfade: { ...state.crossfade, networkLatencyMode: mode }
                    }));
                },

                setManualLatencyOffset: seconds => {
                    set(state => ({
                        crossfade: {
                            ...state.crossfade,
                            manualLatencyOffset: Math.max(0, Math.min(5, seconds))
                        }
                    }));
                },

                resetCrossfadeSettings: () => {
                    set(state => ({
                        crossfade: { ...defaultCrossfadePreferences },
                        _runtime: { ...defaultRuntime }
                    }));
                },

                setAutoDJEnabled: enabled => {
                    set(state => ({
                        autoDJ: { ...state.autoDJ, enabled }
                    }));
                },

                setAutoDJDuration: duration => {
                    set(state => ({
                        autoDJ: { ...state.autoDJ, duration: Math.max(4, Math.min(60, duration)) }
                    }));
                },

                setPreferHarmonic: prefer => {
                    set(state => ({
                        autoDJ: { ...state.autoDJ, preferHarmonic: prefer }
                    }));
                },

                setPreferEnergyMatch: prefer => {
                    set(state => ({
                        autoDJ: { ...state.autoDJ, preferEnergyMatch: prefer }
                    }));
                },

                setUseNotchFilter: use => {
                    set(state => ({
                        autoDJ: { ...state.autoDJ, useNotchFilter: use }
                    }));
                },

                setNotchFrequency: freq => {
                    set(state => ({
                        autoDJ: { ...state.autoDJ, notchFrequency: Math.max(20, Math.min(200, freq)) }
                    }));
                },

                recordTransition: (trackId, transition) => {
                    const record: TransitionRecord = {
                        trackId,
                        timestamp: Date.now(),
                        transitionType: transition.transitionType,
                        compatibilityScore: transition.compatibilityScore,
                        fxApplied: transition.fxApplied || []
                    };

                    set(state => ({
                        autoDJ: {
                            ...state.autoDJ,
                            transitionHistory: [record, ...state.autoDJ.transitionHistory].slice(0, 100)
                        }
                    }));
                },

                clearTransitionHistory: () => {
                    set(state => ({
                        autoDJ: { ...state.autoDJ, transitionHistory: [] }
                    }));
                },

                resetAutoDJSettings: () => {
                    set(state => ({
                        autoDJ: { ...defaultAutoDJPreferences }
                    }));
                },

                setTheme: theme => {
                    set(state => ({
                        ui: { ...state.ui, theme }
                    }));
                },

                setCompactMode: compact => {
                    set(state => ({
                        ui: { ...state.ui, compactMode: compact }
                    }));
                },

                setShowVisualizer: show => {
                    set(state => ({
                        ui: { ...state.ui, showVisualizer: show }
                    }));
                },

                setShowNowPlaying: show => {
                    set(state => ({
                        ui: { ...state.ui, showNowPlaying: show }
                    }));
                },

                setAnimationsEnabled: enabled => {
                    set(state => ({
                        ui: { ...state.ui, animationsEnabled: enabled }
                    }));
                },

                setHighContrastMode: enabled => {
                    set(state => ({
                        ui: { ...state.ui, highContrastMode: enabled }
                    }));
                },

                setReducedMotion: reduced => {
                    set(state => ({
                        ui: { ...state.ui, reducedMotion: reduced }
                    }));
                },

                resetUiSettings: () => {
                    set(state => ({
                        ui: { ...defaultUiPreferences }
                    }));
                },

                setCrossfadeBusy: busy => {
                    set(state => ({
                        _runtime: { ...state._runtime, busy }
                    }));
                },

                setCrossfadeTriggered: triggered => {
                    set(state => ({
                        _runtime: { ...state._runtime, triggered }
                    }));
                },

                setCrossfadeManualTrigger: triggered => {
                    set(state => ({
                        _runtime: { ...state._runtime, manualTrigger: triggered }
                    }));
                },

                cancelCrossfade: () => {
                    set(state => ({
                        _runtime: {
                            ...state._runtime,
                            busy: false,
                            triggered: false,
                            manualTrigger: false
                        }
                    }));
                },

                syncCrossfadeRuntime: () => {
                    set(state => ({
                        _runtime: { ...defaultRuntime }
                    }));
                },

                importPreferences: prefs => {
                    set(state => ({
                        audio: { ...state.audio, ...prefs.audio },
                        visualizer: { ...state.visualizer, ...prefs.visualizer },
                        playback: { ...state.playback, ...prefs.playback },
                        crossfade: { ...state.crossfade, ...prefs.crossfade },
                        autoDJ: { ...state.autoDJ, ...prefs.autoDJ },
                        ui: { ...state.ui, ...prefs.ui }
                    }));
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
                merge: (persisted, current) => ({
                    ...current,
                    ...(persisted as Partial<PreferencesState>),
                    audio: { ...current.audio, ...((persisted as any)?.audio || {}) },
                    visualizer: { ...current.visualizer, ...((persisted as any)?.visualizer || {}) },
                    playback: { ...current.playback, ...((persisted as any)?.playback || {}) },
                    crossfade: { ...current.crossfade, ...((persisted as any)?.crossfade || {}) },
                    autoDJ: { ...current.autoDJ, ...((persisted as any)?.autoDJ || {}) },
                    ui: { ...current.ui, ...((persisted as any)?.ui || {}) },
                    _runtime: { ...defaultRuntime }
                })
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
