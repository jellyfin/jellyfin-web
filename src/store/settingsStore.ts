/**
 * Settings Store - User Settings and Persistence
 *
 * Zustand store for managing user settings with localStorage persistence.
 * Handles audio settings, visualizer settings, UI preferences, and playback settings.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AudioSettings {
    volume: number;
    muted: boolean;
    makeupGain: number;
    enableNormalization: boolean;
    normalizationPercent: number;
}

export interface VisualizerSettings {
    enabled: boolean;
    type: 'waveform' | 'frequency' | 'butterchurn';
    butterchurnPreset: string;
    colorScheme: 'default' | 'vintage' | 'neon' | 'warm' | 'cool';
    sensitivity: number;
    barCount: number;
    smoothing: number;
}

export interface PlaybackSettings {
    defaultPlaybackRate: number;
    autoPlay: boolean;
    rememberPlaybackPosition: boolean;
    skipForwardSeconds: number;
    skipBackSeconds: number;
    enableCrossfade: boolean;
    crossfadeDuration: number;
    gaplessPlayback: boolean;
}

export interface UiSettings {
    theme: 'dark' | 'light' | 'system';
    compactMode: boolean;
    showVisualizer: boolean;
    showNowPlaying: boolean;
    animationsEnabled: boolean;
    highContrastMode: boolean;
    reducedMotion: boolean;
}

export interface SettingsState {
    audio: AudioSettings;
    visualizer: VisualizerSettings;
    playback: PlaybackSettings;
    ui: UiSettings;
}

export interface SettingsActions {
    // Audio settings
    setVolume: (volume: number) => void;
    setMuted: (muted: boolean) => void;
    setMakeupGain: (gain: number) => void;
    setEnableNormalization: (enabled: boolean) => void;
    setNormalizationPercent: (percent: number) => void;
    resetAudioSettings: () => void;

    // Visualizer settings
    setVisualizerEnabled: (enabled: boolean) => void;
    setVisualizerType: (type: VisualizerSettings['type']) => void;
    setButterchurnPreset: (preset: string) => void;
    setVisualizerColorScheme: (scheme: VisualizerSettings['colorScheme']) => void;
    setSensitivity: (sensitivity: number) => void;
    setBarCount: (count: number) => void;
    setSmoothing: (smoothing: number) => void;
    resetVisualizerSettings: () => void;

    // Playback settings
    setDefaultPlaybackRate: (rate: number) => void;
    setAutoPlay: (autoPlay: boolean) => void;
    setRememberPlaybackPosition: (remember: boolean) => void;
    setSkipForwardSeconds: (seconds: number) => void;
    setSkipBackSeconds: (seconds: number) => void;
    setEnableCrossfade: (enabled: boolean) => void;
    setCrossfadeDuration: (duration: number) => void;
    setGaplessPlayback: (enabled: boolean) => void;
    resetPlaybackSettings: () => void;

    // UI settings
    setTheme: (theme: UiSettings['theme']) => void;
    setCompactMode: (compact: boolean) => void;
    setShowVisualizer: (show: boolean) => void;
    setShowNowPlaying: (show: boolean) => void;
    setAnimationsEnabled: (enabled: boolean) => void;
    setHighContrastMode: (enabled: boolean) => void;
    setReducedMotion: (reduced: boolean) => void;
    resetUiSettings: () => void;

    // Bulk operations
    importSettings: (settings: Partial<SettingsState>) => void;
    exportSettings: () => SettingsState;
    resetAllSettings: () => void;
}

const defaultAudioSettings: AudioSettings = {
    volume: 100,
    muted: false,
    makeupGain: 1,
    enableNormalization: true,
    normalizationPercent: 95
};

const defaultVisualizerSettings: VisualizerSettings = {
    enabled: true,
    type: 'butterchurn',
    butterchurnPreset: 'Good',
    colorScheme: 'default',
    sensitivity: 50,
    barCount: 64,
    smoothing: 0.8
};

const defaultPlaybackSettings: PlaybackSettings = {
    defaultPlaybackRate: 1,
    autoPlay: false,
    rememberPlaybackPosition: true,
    skipForwardSeconds: 10,
    skipBackSeconds: 10,
    enableCrossfade: false,
    crossfadeDuration: 5,
    gaplessPlayback: true
};

const defaultUiSettings: UiSettings = {
    theme: 'dark',
    compactMode: false,
    showVisualizer: true,
    showNowPlaying: true,
    animationsEnabled: true,
    highContrastMode: false,
    reducedMotion: false
};

const createInitialState = (): SettingsState => ({
    audio: { ...defaultAudioSettings },
    visualizer: { ...defaultVisualizerSettings },
    playback: { ...defaultPlaybackSettings },
    ui: { ...defaultUiSettings }
});

const SETTINGS_STORAGE_KEY = 'jellyfin-settings-v1';

export const useSettingsStore = create<SettingsState & SettingsActions>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                ...createInitialState(),

                // Audio settings
                setVolume: (volume) => {
                    set((state) => ({
                        audio: { ...state.audio, volume: Math.max(0, Math.min(100, volume)) }
                    }));
                },

                setMuted: (muted) => {
                    set((state) => ({
                        audio: { ...state.audio, muted }
                    }));
                },

                setMakeupGain: (gain) => {
                    set((state) => ({
                        audio: { ...state.audio, makeupGain: Math.max(0.5, Math.min(2, gain)) }
                    }));
                },

                setEnableNormalization: (enabled) => {
                    set((state) => ({
                        audio: { ...state.audio, enableNormalization: enabled }
                    }));
                },

                setNormalizationPercent: (percent) => {
                    set((state) => ({
                        audio: { ...state.audio, normalizationPercent: Math.max(70, Math.min(100, percent)) }
                    }));
                },

                resetAudioSettings: () => {
                    set((state) => ({
                        audio: { ...defaultAudioSettings }
                    }));
                },

                // Visualizer settings
                setVisualizerEnabled: (enabled) => {
                    set((state) => ({
                        visualizer: { ...state.visualizer, enabled }
                    }));
                },

                setVisualizerType: (type) => {
                    set((state) => ({
                        visualizer: { ...state.visualizer, type }
                    }));
                },

                setButterchurnPreset: (preset) => {
                    set((state) => ({
                        visualizer: { ...state.visualizer, butterchurnPreset: preset }
                    }));
                },

                setVisualizerColorScheme: (scheme) => {
                    set((state) => ({
                        visualizer: { ...state.visualizer, colorScheme: scheme }
                    }));
                },

                setSensitivity: (sensitivity) => {
                    set((state) => ({
                        visualizer: { ...state.visualizer, sensitivity: Math.max(1, Math.min(100, sensitivity)) }
                    }));
                },

                setBarCount: (count) => {
                    set((state) => ({
                        visualizer: { ...state.visualizer, barCount: Math.max(8, Math.min(256, count)) }
                    }));
                },

                setSmoothing: (smoothing) => {
                    set((state) => ({
                        visualizer: { ...state.visualizer, smoothing: Math.max(0, Math.min(1, smoothing)) }
                    }));
                },

                resetVisualizerSettings: () => {
                    set((state) => ({
                        visualizer: { ...defaultVisualizerSettings }
                    }));
                },

                // Playback settings
                setDefaultPlaybackRate: (rate) => {
                    const validRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
                    const closestRate = validRates.reduce((prev, curr) =>
                        Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev
                    );

                    set((state) => ({
                        playback: { ...state.playback, defaultPlaybackRate: closestRate }
                    }));
                },

                setAutoPlay: (autoPlay) => {
                    set((state) => ({
                        playback: { ...state.playback, autoPlay }
                    }));
                },

                setRememberPlaybackPosition: (remember) => {
                    set((state) => ({
                        playback: { ...state.playback, rememberPlaybackPosition: remember }
                    }));
                },

                setSkipForwardSeconds: (seconds) => {
                    set((state) => ({
                        playback: { ...state.playback, skipForwardSeconds: Math.max(5, Math.min(120, seconds)) }
                    }));
                },

                setSkipBackSeconds: (seconds) => {
                    set((state) => ({
                        playback: { ...state.playback, skipBackSeconds: Math.max(5, Math.min(60, seconds)) }
                    }));
                },

                setEnableCrossfade: (enabled) => {
                    set((state) => ({
                        playback: { ...state.playback, enableCrossfade: enabled }
                    }));
                },

                setCrossfadeDuration: (duration) => {
                    set((state) => ({
                        playback: { ...state.playback, crossfadeDuration: Math.max(1, Math.min(30, duration)) }
                    }));
                },

                setGaplessPlayback: (enabled) => {
                    set((state) => ({
                        playback: { ...state.playback, gaplessPlayback: enabled }
                    }));
                },

                resetPlaybackSettings: () => {
                    set((state) => ({
                        playback: { ...defaultPlaybackSettings }
                    }));
                },

                // UI settings
                setTheme: (theme) => {
                    set((state) => ({
                        ui: { ...state.ui, theme }
                    }));
                },

                setCompactMode: (compact) => {
                    set((state) => ({
                        ui: { ...state.ui, compactMode: compact }
                    }));
                },

                setShowVisualizer: (show) => {
                    set((state) => ({
                        ui: { ...state.ui, showVisualizer: show }
                    }));
                },

                setShowNowPlaying: (show) => {
                    set((state) => ({
                        ui: { ...state.ui, showNowPlaying: show }
                    }));
                },

                setAnimationsEnabled: (enabled) => {
                    set((state) => ({
                        ui: { ...state.ui, animationsEnabled: enabled }
                    }));
                },

                setHighContrastMode: (enabled) => {
                    set((state) => ({
                        ui: { ...state.ui, highContrastMode: enabled }
                    }));
                },

                setReducedMotion: (reduced) => {
                    set((state) => ({
                        ui: { ...state.ui, reducedMotion: reduced }
                    }));
                },

                resetUiSettings: () => {
                    set((state) => ({
                        ui: { ...defaultUiSettings }
                    }));
                },

                // Bulk operations
                importSettings: (settings) => {
                    set((state) => ({
                        audio: { ...state.audio, ...settings.audio },
                        visualizer: { ...state.visualizer, ...settings.visualizer },
                        playback: { ...state.playback, ...settings.playback },
                        ui: { ...state.ui, ...settings.ui }
                    }));
                },

                exportSettings: () => {
                    return {
                        audio: { ...get().audio },
                        visualizer: { ...get().visualizer },
                        playback: { ...get().playback },
                        ui: { ...get().ui }
                    };
                },

                resetAllSettings: () => {
                    set(createInitialState());
                }
            }),
            {
                name: SETTINGS_STORAGE_KEY,
                storage: createJSONStorage(() => localStorage),
                partialize: (state) => ({
                    audio: state.audio,
                    visualizer: state.visualizer,
                    playback: state.playback,
                    ui: state.ui
                }),
                merge: (persisted, current) => ({
                    ...current,
                    ...(persisted as Partial<SettingsState>),
                    audio: { ...current.audio, ...((persisted as any)?.audio || {}) },
                    visualizer: { ...current.visualizer, ...((persisted as any)?.visualizer || {}) },
                    playback: { ...current.playback, ...((persisted as any)?.playback || {}) },
                    ui: { ...current.ui, ...((persisted as any)?.ui || {}) }
                })
            }
        )
    )
);

// Selectors
export const selectAudioSettings = (state: SettingsState & SettingsActions) => state.audio;
export const selectVisualizerSettings = (state: SettingsState & SettingsActions) => state.visualizer;
export const selectPlaybackSettings = (state: SettingsState & SettingsActions) => state.playback;
export const selectUiSettings = (state: SettingsState & SettingsActions) => state.ui;
export const selectVolume = (state: SettingsState & SettingsActions) => state.audio.volume;
export const selectIsMuted = (state: SettingsState & SettingsActions) => state.audio.muted;
export const selectTheme = (state: SettingsState & SettingsActions) => state.ui.theme;
export const selectVisualizerEnabled = (state: SettingsState & SettingsActions) => state.visualizer.enabled;
