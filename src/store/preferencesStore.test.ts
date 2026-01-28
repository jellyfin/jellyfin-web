import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePreferencesStore, getCrossfadeSustain, getCrossfadeFadeOut, getEffectiveLatency, getEffectiveCrossfadeDuration, isCrossfadeActive, isCrossfadeEnabled, isAutoDJEnabled, isVisualizerEnabled, getVolume, isMuted, getTheme, getSkipLengths, getAutoPlay, getRememberPlaybackPosition, getNormalizationEnabled, getNormalizationPercent, getMakeupGain } from './preferencesStore';

const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('preferencesStore', () => {
    beforeEach(() => {
        localStorageMock.clear();
        usePreferencesStore.setState((state) => ({
            ...state,
            audio: {
                volume: 100,
                muted: false,
                makeupGain: 1,
                enableNormalization: true,
                normalizationPercent: 95
            },
            visualizer: {
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
            },
            playback: {
                defaultPlaybackRate: 1,
                autoPlay: false,
                rememberPlaybackPosition: true,
                skipForwardSeconds: 10,
                skipBackSeconds: 10,
                gaplessPlayback: true
            },
            crossfade: {
                crossfadeDuration: 5,
                crossfadeEnabled: true,
                networkLatencyCompensation: 1,
                networkLatencyMode: 'auto',
                manualLatencyOffset: 0
            },
            autoDJ: {
                enabled: false,
                duration: 16,
                preferHarmonic: true,
                preferEnergyMatch: true,
                useNotchFilter: true,
                notchFrequency: 60,
                transitionHistory: []
            },
            ui: {
                theme: 'dark',
                compactMode: false,
                showVisualizer: true,
                showNowPlaying: true,
                animationsEnabled: true,
                highContrastMode: false,
                reducedMotion: false,
                brightness: 50
            },
            _runtime: {
                busy: false,
                triggered: false,
                manualTrigger: false
            }
        }));
    });

    afterEach(() => {
        localStorageMock.clear();
    });

    describe('audio preferences', () => {
        it('should set volume with clamping', () => {
            usePreferencesStore.getState().setVolume(150);
            expect(usePreferencesStore.getState().audio.volume).toBe(100);

            usePreferencesStore.getState().setVolume(50);
            expect(usePreferencesStore.getState().audio.volume).toBe(50);

            usePreferencesStore.getState().setVolume(-10);
            expect(usePreferencesStore.getState().audio.volume).toBe(0);
        });

        it('should set muted state', () => {
            usePreferencesStore.getState().setMuted(true);
            expect(usePreferencesStore.getState().audio.muted).toBe(true);

            usePreferencesStore.getState().setMuted(false);
            expect(usePreferencesStore.getState().audio.muted).toBe(false);
        });

        it('should set makeup gain with clamping', () => {
            usePreferencesStore.getState().setMakeupGain(3);
            expect(usePreferencesStore.getState().audio.makeupGain).toBe(2);

            usePreferencesStore.getState().setMakeupGain(0.2);
            expect(usePreferencesStore.getState().audio.makeupGain).toBe(0.5);

            usePreferencesStore.getState().setMakeupGain(1.5);
            expect(usePreferencesStore.getState().audio.makeupGain).toBe(1.5);
        });

        it('should enable/disable normalization', () => {
            usePreferencesStore.getState().setEnableNormalization(false);
            expect(usePreferencesStore.getState().audio.enableNormalization).toBe(false);

            usePreferencesStore.getState().setEnableNormalization(true);
            expect(usePreferencesStore.getState().audio.enableNormalization).toBe(true);
        });

        it('should set normalization percent with clamping', () => {
            usePreferencesStore.getState().setNormalizationPercent(50);
            expect(usePreferencesStore.getState().audio.normalizationPercent).toBe(70);

            usePreferencesStore.getState().setNormalizationPercent(95);
            expect(usePreferencesStore.getState().audio.normalizationPercent).toBe(95);

            usePreferencesStore.getState().setNormalizationPercent(150);
            expect(usePreferencesStore.getState().audio.normalizationPercent).toBe(100);
        });

        it('should reset audio settings', () => {
            usePreferencesStore.getState().setVolume(30);
            usePreferencesStore.getState().setMuted(true);

            usePreferencesStore.getState().resetAudioSettings();

            const state = usePreferencesStore.getState();
            expect(state.audio.volume).toBe(100);
            expect(state.audio.muted).toBe(false);
        });
    });

    describe('visualizer preferences', () => {
        it('should enable/disable visualizer', () => {
            usePreferencesStore.getState().setVisualizerEnabled(false);
            expect(usePreferencesStore.getState().visualizer.enabled).toBe(false);

            usePreferencesStore.getState().setVisualizerEnabled(true);
            expect(usePreferencesStore.getState().visualizer.enabled).toBe(true);
        });

        it('should set visualizer type', () => {
            usePreferencesStore.getState().setVisualizerType('waveform');
            expect(usePreferencesStore.getState().visualizer.type).toBe('waveform');

            usePreferencesStore.getState().setVisualizerType('frequency');
            expect(usePreferencesStore.getState().visualizer.type).toBe('frequency');
        });

        it('should set butterchurn preset', () => {
            usePreferencesStore.getState().setButterchurnPreset('Classic');
            expect(usePreferencesStore.getState().visualizer.butterchurn.preset).toBe('Classic');
        });

        it('should set sensitivity with clamping', () => {
            usePreferencesStore.getState().setSensitivity(150);
            expect(usePreferencesStore.getState().visualizer.sensitivity).toBe(100);

            usePreferencesStore.getState().setSensitivity(0);
            expect(usePreferencesStore.getState().visualizer.sensitivity).toBe(1);

            usePreferencesStore.getState().setSensitivity(50);
            expect(usePreferencesStore.getState().visualizer.sensitivity).toBe(50);
        });

        it('should set bar count with clamping', () => {
            usePreferencesStore.getState().setBarCount(512);
            expect(usePreferencesStore.getState().visualizer.barCount).toBe(256);

            usePreferencesStore.getState().setBarCount(4);
            expect(usePreferencesStore.getState().visualizer.barCount).toBe(8);

            usePreferencesStore.getState().setBarCount(128);
            expect(usePreferencesStore.getState().visualizer.barCount).toBe(128);
        });

        it('should set smoothing with clamping', () => {
            usePreferencesStore.getState().setSmoothing(1.5);
            expect(usePreferencesStore.getState().visualizer.smoothing).toBe(1);

            usePreferencesStore.getState().setSmoothing(-0.1);
            expect(usePreferencesStore.getState().visualizer.smoothing).toBe(0);

            usePreferencesStore.getState().setSmoothing(0.5);
            expect(usePreferencesStore.getState().visualizer.smoothing).toBe(0.5);
        });

        it('should reset visualizer settings', () => {
            usePreferencesStore.getState().setVisualizerEnabled(true);
            usePreferencesStore.getState().setSensitivity(75);

            usePreferencesStore.getState().resetVisualizerSettings();

            const state = usePreferencesStore.getState();
            expect(state.visualizer.enabled).toBe(false);
            expect(state.visualizer.sensitivity).toBe(50);
        });
    });

    describe('playback preferences', () => {
        it('should set default playback rate', () => {
            usePreferencesStore.getState().setDefaultPlaybackRate(1.5);
            expect(usePreferencesStore.getState().playback.defaultPlaybackRate).toBe(1.5);

            usePreferencesStore.getState().setDefaultPlaybackRate(1.3);
            expect(usePreferencesStore.getState().playback.defaultPlaybackRate).toBe(1.25);
        });

        it('should set autoplay', () => {
            usePreferencesStore.getState().setAutoPlay(true);
            expect(usePreferencesStore.getState().playback.autoPlay).toBe(true);

            usePreferencesStore.getState().setAutoPlay(false);
            expect(usePreferencesStore.getState().playback.autoPlay).toBe(false);
        });

        it('should set remember playback position', () => {
            usePreferencesStore.getState().setRememberPlaybackPosition(false);
            expect(usePreferencesStore.getState().playback.rememberPlaybackPosition).toBe(false);

            usePreferencesStore.getState().setRememberPlaybackPosition(true);
            expect(usePreferencesStore.getState().playback.rememberPlaybackPosition).toBe(true);
        });

        it('should set skip forward seconds with clamping', () => {
            usePreferencesStore.getState().setSkipForwardSeconds(150);
            expect(usePreferencesStore.getState().playback.skipForwardSeconds).toBe(120);

            usePreferencesStore.getState().setSkipForwardSeconds(3);
            expect(usePreferencesStore.getState().playback.skipForwardSeconds).toBe(5);

            usePreferencesStore.getState().setSkipForwardSeconds(30);
            expect(usePreferencesStore.getState().playback.skipForwardSeconds).toBe(30);
        });

        it('should set skip back seconds with clamping', () => {
            usePreferencesStore.getState().setSkipBackSeconds(100);
            expect(usePreferencesStore.getState().playback.skipBackSeconds).toBe(60);

            usePreferencesStore.getState().setSkipBackSeconds(2);
            expect(usePreferencesStore.getState().playback.skipBackSeconds).toBe(5);

            usePreferencesStore.getState().setSkipBackSeconds(30);
            expect(usePreferencesStore.getState().playback.skipBackSeconds).toBe(30);
        });

        it('should set gapless playback', () => {
            usePreferencesStore.getState().setGaplessPlayback(false);
            expect(usePreferencesStore.getState().playback.gaplessPlayback).toBe(false);

            usePreferencesStore.getState().setGaplessPlayback(true);
            expect(usePreferencesStore.getState().playback.gaplessPlayback).toBe(true);
        });

        it('should reset playback settings', () => {
            usePreferencesStore.getState().setAutoPlay(true);
            usePreferencesStore.getState().setSkipForwardSeconds(20);

            usePreferencesStore.getState().resetPlaybackSettings();

            const state = usePreferencesStore.getState();
            expect(state.playback.autoPlay).toBe(false);
            expect(state.playback.skipForwardSeconds).toBe(10);
        });
    });

    describe('crossfade preferences', () => {
        it('should set crossfade duration', () => {
            usePreferencesStore.getState().setCrossfadeDuration(8);
            expect(usePreferencesStore.getState().crossfade.crossfadeDuration).toBe(8);

            usePreferencesStore.getState().setCrossfadeDuration(0);
            expect(usePreferencesStore.getState().crossfade.crossfadeEnabled).toBe(false);
        });

        it('should set crossfade enabled', () => {
            usePreferencesStore.getState().setCrossfadeEnabled(false);
            expect(usePreferencesStore.getState().crossfade.crossfadeEnabled).toBe(false);

            usePreferencesStore.getState().setCrossfadeEnabled(true);
            expect(usePreferencesStore.getState().crossfade.crossfadeEnabled).toBe(true);
        });

        it('should set network latency compensation', () => {
            usePreferencesStore.getState().setNetworkLatencyCompensation(3);
            expect(usePreferencesStore.getState().crossfade.networkLatencyCompensation).toBe(3);

            usePreferencesStore.getState().setNetworkLatencyCompensation(15);
            expect(usePreferencesStore.getState().crossfade.networkLatencyCompensation).toBe(10);
        });

        it('should set network latency mode', () => {
            usePreferencesStore.getState().setNetworkLatencyMode('manual');
            expect(usePreferencesStore.getState().crossfade.networkLatencyMode).toBe('manual');

            usePreferencesStore.getState().setNetworkLatencyMode('auto');
            expect(usePreferencesStore.getState().crossfade.networkLatencyMode).toBe('auto');
        });

        it('should reset crossfade settings', () => {
            usePreferencesStore.getState().setCrossfadeDuration(0);
            usePreferencesStore.getState().setNetworkLatencyMode('manual');

            usePreferencesStore.getState().resetCrossfadeSettings();

            const state = usePreferencesStore.getState();
            expect(state.crossfade.crossfadeDuration).toBe(5);
            expect(state.crossfade.networkLatencyMode).toBe('auto');
        });
    });

    describe('autoDJ preferences', () => {
        it('should enable/disable autoDJ', () => {
            usePreferencesStore.getState().setAutoDJEnabled(true);
            expect(usePreferencesStore.getState().autoDJ.enabled).toBe(true);

            usePreferencesStore.getState().setAutoDJEnabled(false);
            expect(usePreferencesStore.getState().autoDJ.enabled).toBe(false);
        });

        it('should set autoDJ duration with clamping', () => {
            usePreferencesStore.getState().setAutoDJDuration(30);
            expect(usePreferencesStore.getState().autoDJ.duration).toBe(30);

            usePreferencesStore.getState().setAutoDJDuration(100);
            expect(usePreferencesStore.getState().autoDJ.duration).toBe(60);

            usePreferencesStore.getState().setAutoDJDuration(2);
            expect(usePreferencesStore.getState().autoDJ.duration).toBe(4);
        });

        it('should set harmonic preference', () => {
            usePreferencesStore.getState().setPreferHarmonic(false);
            expect(usePreferencesStore.getState().autoDJ.preferHarmonic).toBe(false);

            usePreferencesStore.getState().setPreferHarmonic(true);
            expect(usePreferencesStore.getState().autoDJ.preferHarmonic).toBe(true);
        });

        it('should record transitions', () => {
            usePreferencesStore.getState().recordTransition('track1', {
                transitionType: 'crossfade',
                compatibilityScore: 0.95,
                fxApplied: ['normalization']
            });

            const state = usePreferencesStore.getState();
            expect(state.autoDJ.transitionHistory).toHaveLength(1);
            expect(state.autoDJ.transitionHistory[0].trackId).toBe('track1');
        });

        it('should limit transition history to 100', () => {
            for (let i = 0; i < 110; i++) {
                usePreferencesStore.getState().recordTransition(`track${i}`, {
                    transitionType: 'crossfade',
                    compatibilityScore: 0.9,
                    fxApplied: []
                });
            }

            const state = usePreferencesStore.getState();
            expect(state.autoDJ.transitionHistory).toHaveLength(100);
        });

        it('should clear transition history', () => {
            usePreferencesStore.getState().recordTransition('track1', {
                transitionType: 'crossfade',
                compatibilityScore: 0.9,
                fxApplied: []
            });

            usePreferencesStore.getState().clearTransitionHistory();

            expect(usePreferencesStore.getState().autoDJ.transitionHistory).toHaveLength(0);
        });

        it('should reset autoDJ settings', () => {
            usePreferencesStore.getState().setAutoDJEnabled(true);
            usePreferencesStore.getState().setAutoDJDuration(25);

            usePreferencesStore.getState().resetAutoDJSettings();

            const state = usePreferencesStore.getState();
            expect(state.autoDJ.enabled).toBe(false);
            expect(state.autoDJ.duration).toBe(16);
        });
    });

    describe('UI preferences', () => {
        it('should set theme', () => {
            usePreferencesStore.getState().setTheme('light');
            expect(usePreferencesStore.getState().ui.theme).toBe('light');

            usePreferencesStore.getState().setTheme('system');
            expect(usePreferencesStore.getState().ui.theme).toBe('system');
        });

        it('should set compact mode', () => {
            usePreferencesStore.getState().setCompactMode(true);
            expect(usePreferencesStore.getState().ui.compactMode).toBe(true);

            usePreferencesStore.getState().setCompactMode(false);
            expect(usePreferencesStore.getState().ui.compactMode).toBe(false);
        });

        it('should set animations enabled', () => {
            usePreferencesStore.getState().setAnimationsEnabled(false);
            expect(usePreferencesStore.getState().ui.animationsEnabled).toBe(false);

            usePreferencesStore.getState().setAnimationsEnabled(true);
            expect(usePreferencesStore.getState().ui.animationsEnabled).toBe(true);
        });

        it('should reset UI settings', () => {
            usePreferencesStore.getState().setTheme('light');
            usePreferencesStore.getState().setCompactMode(true);

            usePreferencesStore.getState().resetUiSettings();

            const state = usePreferencesStore.getState();
            expect(state.ui.theme).toBe('dark');
            expect(state.ui.compactMode).toBe(false);
        });
    });

    describe('crossfade runtime', () => {
        it('should set crossfade busy state', () => {
            usePreferencesStore.getState().setCrossfadeBusy(true);
            expect(usePreferencesStore.getState()._runtime.busy).toBe(true);

            usePreferencesStore.getState().setCrossfadeBusy(false);
            expect(usePreferencesStore.getState()._runtime.busy).toBe(false);
        });

        it('should cancel crossfade', () => {
            usePreferencesStore.getState().setCrossfadeBusy(true);
            usePreferencesStore.getState().setCrossfadeTriggered(true);
            usePreferencesStore.getState().setCrossfadeManualTrigger(true);

            usePreferencesStore.getState().cancelCrossfade();

            const runtime = usePreferencesStore.getState()._runtime;
            expect(runtime.busy).toBe(false);
            expect(runtime.triggered).toBe(false);
            expect(runtime.manualTrigger).toBe(false);
        });

        it('should sync crossfade runtime', () => {
            usePreferencesStore.getState().setCrossfadeBusy(true);

            usePreferencesStore.getState().syncCrossfadeRuntime();

            const runtime = usePreferencesStore.getState()._runtime;
            expect(runtime.busy).toBe(false);
            expect(runtime.triggered).toBe(false);
            expect(runtime.manualTrigger).toBe(false);
        });
    });

    describe('import/export', () => {
        it('should export preferences', () => {
            const exported = usePreferencesStore.getState().exportPreferences();

            expect(exported.audio).toBeDefined();
            expect(exported.visualizer).toBeDefined();
            expect(exported.playback).toBeDefined();
            expect(exported.crossfade).toBeDefined();
            expect(exported.autoDJ).toBeDefined();
            expect(exported.ui).toBeDefined();
        });

        it('should import preferences', () => {
            const importData = {
                audio: { volume: 50 },
                visualizer: { enabled: false }
            } as any;

            usePreferencesStore.getState().importPreferences(importData);

            const state = usePreferencesStore.getState();
            expect(state.audio.volume).toBe(50);
            expect(state.visualizer.enabled).toBe(false);
        });

        it('should reset all preferences', () => {
            usePreferencesStore.getState().setVolume(30);
            usePreferencesStore.getState().setTheme('light');

            usePreferencesStore.getState().resetAllPreferences();

            const state = usePreferencesStore.getState();
            expect(state.audio.volume).toBe(100);
            expect(state.ui.theme).toBe('dark');
        });
    });

    describe('helper functions', () => {
        it('should calculate crossfade sustain', () => {
            expect(getCrossfadeSustain(0)).toBe(0);
            expect(getCrossfadeSustain(0.2)).toBe(0.1);
            expect(getCrossfadeSustain(1)).toBe(1 / 12);
            expect(getCrossfadeSustain(10)).toBe(10 / 12);
        });

        it('should calculate crossfade fade out', () => {
            expect(getCrossfadeFadeOut(0)).toBe(0);
            expect(getCrossfadeFadeOut(0.2)).toBe(0.2);
            expect(getCrossfadeFadeOut(1)).toBe(2);
        });

        it('should get effective latency', () => {
            usePreferencesStore.getState().setNetworkLatencyMode('auto');
            usePreferencesStore.getState().setNetworkLatencyCompensation(2);

            expect(getEffectiveLatency()).toBe(2);

            usePreferencesStore.getState().setNetworkLatencyMode('manual');
            usePreferencesStore.getState().setManualLatencyOffset(1.5);

            expect(getEffectiveLatency()).toBe(1.5);
        });

        it('should get volume', () => {
            usePreferencesStore.getState().setVolume(75);
            expect(getVolume()).toBe(75);
        });

        it('should check muted state', () => {
            usePreferencesStore.getState().setMuted(false);
            expect(isMuted()).toBe(false);

            usePreferencesStore.getState().setMuted(true);
            expect(isMuted()).toBe(true);
        });

        it('should get theme', () => {
            usePreferencesStore.getState().setTheme('light');
            expect(getTheme()).toBe('light');
        });

        it('should get skip lengths', () => {
            usePreferencesStore.getState().setSkipForwardSeconds(15);
            usePreferencesStore.getState().setSkipBackSeconds(5);

            const lengths = getSkipLengths();
            expect(lengths.forward).toBe(15);
            expect(lengths.back).toBe(5);
        });

        it('should check autoplay state', () => {
            usePreferencesStore.getState().setAutoPlay(false);
            expect(getAutoPlay()).toBe(false);

            usePreferencesStore.getState().setAutoPlay(true);
            expect(getAutoPlay()).toBe(true);
        });

        it('should check visualizer enabled', () => {
            usePreferencesStore.getState().setVisualizerEnabled(true);
            expect(isVisualizerEnabled()).toBe(true);

            usePreferencesStore.getState().setVisualizerEnabled(false);
            expect(isVisualizerEnabled()).toBe(false);
        });

        it('should check autoDJ enabled', () => {
            usePreferencesStore.getState().setAutoDJEnabled(false);
            expect(isAutoDJEnabled()).toBe(false);

            usePreferencesStore.getState().setAutoDJEnabled(true);
            expect(isAutoDJEnabled()).toBe(true);
        });

        it('should check crossfade enabled', () => {
            usePreferencesStore.getState().setCrossfadeEnabled(true);
            expect(isCrossfadeEnabled()).toBe(true);

            usePreferencesStore.getState().setCrossfadeEnabled(false);
            expect(isCrossfadeEnabled()).toBe(false);
        });

        it('should check crossfade active', () => {
            usePreferencesStore.getState().setCrossfadeBusy(false);
            expect(isCrossfadeActive()).toBe(false);

            usePreferencesStore.getState().setCrossfadeBusy(true);
            expect(isCrossfadeActive()).toBe(true);
        });

        it('should get makeup gain', () => {
            usePreferencesStore.getState().setMakeupGain(1.5);
            expect(getMakeupGain()).toBe(1.5);
        });

        it('should get normalization enabled', () => {
            usePreferencesStore.getState().setEnableNormalization(true);
            expect(getNormalizationEnabled()).toBe(true);

            usePreferencesStore.getState().setEnableNormalization(false);
            expect(getNormalizationEnabled()).toBe(false);
        });

        it('should get normalization percent', () => {
            usePreferencesStore.getState().setNormalizationPercent(85);
            expect(getNormalizationPercent()).toBe(85);
        });

        it('should get remember playback position', () => {
            usePreferencesStore.getState().setRememberPlaybackPosition(false);
            expect(getRememberPlaybackPosition()).toBe(false);

            usePreferencesStore.getState().setRememberPlaybackPosition(true);
            expect(getRememberPlaybackPosition()).toBe(true);
        });

        it('should get effective crossfade duration', () => {
            usePreferencesStore.getState().setCrossfadeDuration(5);
            usePreferencesStore.getState().setNetworkLatencyMode('auto');
            usePreferencesStore.getState().setNetworkLatencyCompensation(1);

            expect(getEffectiveCrossfadeDuration()).toBe(6);
        });
    });
});
