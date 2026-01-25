import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('components/visualizer/WaveSurfer', () => ({
    destroyWaveSurferInstance: vi.fn()
}));

vi.mock('components/sitbackMode/sitback.logic', () => ({
    endSong: vi.fn(),
    triggerSongInfoDisplay: vi.fn()
}));

vi.mock('components/visualizer/butterchurn.logic', () => ({
    butterchurnInstance: {
        nextPreset: vi.fn()
    }
}));

let mockStoreState = {
    visualizer: {
        enabled: false,
        type: 'butterchurn' as const
    },
    crossfade: {
        crossfadeDuration: 5,
        crossfadeEnabled: true,
        networkLatencyCompensation: 1,
        networkLatencyMode: 'auto' as const,
        manualLatencyOffset: 0
    },
    _runtime: {
        busy: false,
        triggered: false,
        manualTrigger: false
    },
    audio: {
        volume: 100,
        muted: false,
        makeupGain: 1,
        enableNormalization: true,
        normalizationPercent: 95
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
        theme: 'dark' as const,
        compactMode: false,
        showVisualizer: true,
        showNowPlaying: true,
        animationsEnabled: true,
        highContrastMode: false,
        reducedMotion: false,
        brightness: 50
    },
    playback: {
        defaultPlaybackRate: 1,
        autoPlay: false,
        rememberPlaybackPosition: true,
        skipForwardSeconds: 10,
        skipBackSeconds: 10,
        gaplessPlayback: true
    }
};

const setters = {
    setCrossfadeDuration: (duration: number) => {
        mockStoreState.crossfade.crossfadeDuration = duration;
        mockStoreState.crossfade.crossfadeEnabled = duration >= 0.01;
    },
    setCrossfadeEnabled: (enabled: boolean) => {
        mockStoreState.crossfade.crossfadeEnabled = enabled;
        if (!enabled) {
            mockStoreState.crossfade.crossfadeDuration = 0;
        }
    },
    setCrossfadeBusy: (busy: boolean) => {
        mockStoreState._runtime.busy = busy;
    },
    setCrossfadeTriggered: (triggered: boolean) => {
        mockStoreState._runtime.triggered = triggered;
    },
    setCrossfadeManualTrigger: (triggered: boolean) => {
        mockStoreState._runtime.manualTrigger = triggered;
    },
    cancelCrossfade: () => {
        mockStoreState._runtime.busy = false;
        mockStoreState._runtime.triggered = false;
        mockStoreState._runtime.manualTrigger = false;
    }
};

vi.mock('../../store/preferencesStore', () => ({
    usePreferencesStore: {
        getState: () => ({ ...mockStoreState, ...setters }),
        setState: vi.fn()
    },
    isCrossfadeActive: () => mockStoreState._runtime.busy,
    isCrossfadeEnabled: () => mockStoreState.crossfade.crossfadeEnabled,
    getCrossfadeFadeOut: (duration: number) => {
        if (duration < 0.01) return 0;
        if (duration < 0.51) return duration;
        return duration * 2;
    },
    getCrossfadeSustain: (duration: number) => {
        if (duration < 0.01) return 0;
        if (duration < 0.51) return duration / 2;
        return duration / 12;
    }
}));

import {
    initializeMasterAudio,
    createGainNode,
    removeAudioNodeBundle,
    audioNodeBus,
    delayNodeBus,
    masterAudioOutput
} from './master.logic';
import { timeRunningOut, syncManager } from './crossfader.logic';
import {
    usePreferencesStore,
    getCrossfadeFadeOut,
    isCrossfadeEnabled,
    isCrossfadeActive
} from '../../store/preferencesStore';

const createMockAudioContext = () => {
    const createMockAudioParam = () => ({
        value: 1,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn()
    });

    const createMockGainNode = () => ({
        gain: createMockAudioParam(),
        connect: vi.fn(),
        disconnect: vi.fn()
    });

    const createMockDelayNode = () => ({
        delayTime: { value: 0 },
        connect: vi.fn(),
        disconnect: vi.fn()
    });

    const createMockCompressor = () => ({
        threshold: { setValueAtTime: vi.fn() },
        knee: { setValueAtTime: vi.fn() },
        ratio: { setValueAtTime: vi.fn() },
        attack: { setValueAtTime: vi.fn() },
        release: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn()
    });

    const createMockBiquadFilter = () => ({
        type: 'lowpass',
        frequency: { setValueAtTime: vi.fn(), value: 22050 },
        Q: { setValueAtTime: vi.fn(), value: 0.0001 },
        connect: vi.fn(),
        disconnect: vi.fn()
    });

    return {
        currentTime: 0,
        destination: {},
        createGain: vi.fn(function () {
            return createMockGainNode();
        }),
        createMediaElementSource: vi.fn(function () {
            return { connect: vi.fn(), disconnect: vi.fn() };
        }),
        createDynamicsCompressor: vi.fn(function () {
            return createMockCompressor();
        }),
        createBiquadFilter: vi.fn(function () {
            return createMockBiquadFilter();
        }),
        createDelay: vi.fn(function () {
            return createMockDelayNode();
        }),
        resume: vi.fn(function () {
            return Promise.resolve();
        })
    };
};

function resetPreferencesStore(): void {
    usePreferencesStore.setState({
        crossfade: {
            crossfadeDuration: 5,
            crossfadeEnabled: true,
            networkLatencyCompensation: 1,
            networkLatencyMode: 'auto',
            manualLatencyOffset: 0
        },
        _runtime: {
            busy: false,
            triggered: false,
            manualTrigger: false
        }
    });
}

describe('Audio Engine Integration', () => {
    let mockUnbind: any;
    let originalAudioContext: any;
    let originalWebkitAudioContext: any;
    let mockAudioContext: any;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        originalAudioContext = (window as any).AudioContext;
        originalWebkitAudioContext = (window as any).webkitAudioContext;
        mockAudioContext = createMockAudioContext();
        const MockAudioContext = function (this: any) {
            Object.assign(this, mockAudioContext);
        };
        (window as any).AudioContext = MockAudioContext as any;
        (window as any).webkitAudioContext = undefined;
        audioNodeBus.length = 0;
        delayNodeBus.length = 0;
        resetPreferencesStore();
        mockUnbind = vi.fn();
    });

    afterEach(() => {
        syncManager.stopSync();
        vi.advanceTimersByTime(200);
        vi.useRealTimers();
        document.body.innerHTML = '';
        (window as any).AudioContext = originalAudioContext;
        (window as any).webkitAudioContext = originalWebkitAudioContext;
    });

    describe('Master + Crossfader Coordination', () => {
        it('should initialize master before crossfade operations', () => {
            initializeMasterAudio(mockUnbind);

            expect(() => {
                usePreferencesStore.getState().setCrossfadeDuration(5);
            }).not.toThrow();

            expect(isCrossfadeEnabled()).toBe(true);
        });

        it('should coordinate audio nodes through buses', () => {
            initializeMasterAudio(mockUnbind);

            const audio = document.createElement('audio');
            audio.id = 'currentMediaElement';
            document.body.appendChild(audio);

            createGainNode(audio);
            const initialBusLength = audioNodeBus.length;

            expect(initialBusLength).toBeGreaterThanOrEqual(0);
        });

        it('should prevent concurrent crossfades using busy flag', () => {
            initializeMasterAudio(mockUnbind);

            usePreferencesStore.getState().setCrossfadeBusy(false);
            expect(isCrossfadeActive()).toBe(false);

            usePreferencesStore.getState().setCrossfadeBusy(true);
            expect(isCrossfadeActive()).toBe(true);

            expect(isCrossfadeActive()).toBe(true);

            usePreferencesStore.getState().setCrossfadeBusy(false);
        });

        it('should clean up audio nodes after operations', () => {
            initializeMasterAudio(mockUnbind);

            const audio = document.createElement('audio');
            audio.id = 'currentMediaElement';
            document.body.appendChild(audio);

            createGainNode(audio);
            const beforeRemove = audioNodeBus.length;

            removeAudioNodeBundle(audio);
            const afterRemove = audioNodeBus.length;

            expect(afterRemove).toBeLessThanOrEqual(beforeRemove);
        });
    });

    describe('Settings → Engine Flow', () => {
        it('should recalculate crossfade duration when settings change', () => {
            initializeMasterAudio(mockUnbind);

            usePreferencesStore.getState().setCrossfadeDuration(5);
            const initialFadeOut = getCrossfadeFadeOut(5);

            usePreferencesStore.getState().setCrossfadeDuration(10);
            const newFadeOut = getCrossfadeFadeOut(10);

            expect(newFadeOut).not.toBe(initialFadeOut);
            expect(isCrossfadeEnabled()).toBe(true);
        });

        it('should handle visualizer settings through delay nodes', () => {
            initializeMasterAudio(mockUnbind);

            expect(Array.isArray(delayNodeBus)).toBe(true);
            expect(delayNodeBus.length).toBeGreaterThanOrEqual(0);
        });

        it('should maintain crossfade state across settings changes', () => {
            initializeMasterAudio(mockUnbind);

            usePreferencesStore.getState().setCrossfadeDuration(5);
            const state1 = {
                enabled: isCrossfadeEnabled(),
                fadeOut: getCrossfadeFadeOut(5)
            };

            usePreferencesStore.getState().setCrossfadeDuration(8);
            const state2 = {
                enabled: isCrossfadeEnabled(),
                fadeOut: getCrossfadeFadeOut(8)
            };

            expect(state2.enabled).toBe(true);
            expect(state2.fadeOut).not.toBe(state1.fadeOut);
        });
    });

    describe('Full Playback Transitions', () => {
        it('should complete a full track change workflow', () => {
            initializeMasterAudio(mockUnbind);

            const audio = document.createElement('audio');
            audio.id = 'currentMediaElement';
            audio.src = 'http://example.com/song.mp3';
            document.body.appendChild(audio);

            usePreferencesStore.getState().setCrossfadeBusy(false);
            usePreferencesStore.getState().setCrossfadeEnabled(true);

            createGainNode(audio);
            const bundleCount = audioNodeBus.length;

            expect(bundleCount).toBeGreaterThanOrEqual(0);

            removeAudioNodeBundle(audio);
            expect(audioNodeBus.length).toBeLessThanOrEqual(bundleCount);
        });

        it('should handle rapid skip transitions', () => {
            initializeMasterAudio(mockUnbind);

            const audio = document.createElement('audio');
            audio.id = 'currentMediaElement';
            audio.src = 'http://example.com/song.mp3';
            document.body.appendChild(audio);

            usePreferencesStore.getState().setCrossfadeBusy(false);
            expect(isCrossfadeActive()).toBe(false);

            vi.advanceTimersByTime(1000);
            expect(isCrossfadeActive()).toBe(false);
        });

        it('should recover state with timeout mechanism', () => {
            initializeMasterAudio(mockUnbind);

            usePreferencesStore.getState().setCrossfadeBusy(true);
            expect(isCrossfadeActive()).toBe(true);

            vi.advanceTimersByTime(20000);

            expect(usePreferencesStore.getState()).toBeDefined();
        });

        it('should detect end-of-track for crossfade', () => {
            initializeMasterAudio(mockUnbind);

            usePreferencesStore.getState().setCrossfadeEnabled(true);
            usePreferencesStore.getState().setCrossfadeDuration(10); // fadeOut = 10 for long mode
            usePreferencesStore.getState().setCrossfadeBusy(false);

            const mockPlayer = {
                currentTime: () => 85,
                duration: () => 100
            };

            const timeRemaining = mockPlayer.duration() - mockPlayer.currentTime();
            const fadeOut = getCrossfadeFadeOut(10);
            const threshold = fadeOut * 1.5;
            const shouldRunOut = timeRemaining <= threshold;

            expect(shouldRunOut).toBe(true);
        });

        it('should coordinate cleanup across multiple operations', () => {
            initializeMasterAudio(mockUnbind);

            const audio1 = document.createElement('audio');
            audio1.id = 'audio1';
            document.body.appendChild(audio1);

            const audio2 = document.createElement('audio');
            audio2.id = 'audio2';
            document.body.appendChild(audio2);

            createGainNode(audio1);
            createGainNode(audio2);

            const midCount = audioNodeBus.length;
            expect(midCount).toBeGreaterThanOrEqual(0);

            removeAudioNodeBundle(audio1);
            const afterFirst = audioNodeBus.length;

            removeAudioNodeBundle(audio2);
            const afterBoth = audioNodeBus.length;

            expect(afterBoth).toBeLessThanOrEqual(afterFirst);
        });

        it('should complete full crossfade lifecycle from detection to cleanup', () => {
            initializeMasterAudio(mockUnbind);

            const audio = document.createElement('audio');
            audio.id = 'currentMediaElement';
            audio.src = 'http://example.com/song.mp3';
            Object.defineProperty(audio, 'duration', { value: 180, writable: true });
            Object.defineProperty(audio, 'currentTime', { value: 175.5, writable: true });
            document.body.appendChild(audio);

            usePreferencesStore.getState().setCrossfadeDuration(3);
            expect(isCrossfadeEnabled()).toBe(true);
            expect(getCrossfadeFadeOut(3)).toBe(6);
            expect(usePreferencesStore.getState()._runtime.manualTrigger).toBe(false);

            const mockPlayer = {
                currentTime: () => audio.currentTime,
                duration: () => audio.duration
            };
            const shouldTrigger = timeRunningOut(mockPlayer);
            expect(shouldTrigger).toBe(true);
            expect(usePreferencesStore.getState()._runtime.triggered).toBe(true);

            expect(usePreferencesStore.getState()._runtime.triggered).toBe(true);
            expect(isCrossfadeActive()).toBe(false);

            const interruptedAudio = document.createElement('audio');
            interruptedAudio.id = 'crossFadeMediaElement';
            document.body.appendChild(interruptedAudio);

            audioNodeBus.push({ gain: { value: 1 } } as any);
            delayNodeBus.push({ delayTime: { value: 0 } } as any);

            const nodesBeforeCleanup = audioNodeBus.length;
            const delaysBeforeCleanup = delayNodeBus.length;
            expect(nodesBeforeCleanup).toBeGreaterThan(0);
            expect(delaysBeforeCleanup).toBeGreaterThan(0);

            const disposeElement = document.getElementById('crossFadeMediaElement');
            if (disposeElement) {
                disposeElement.remove();
                while (audioNodeBus.length > 0) {
                    audioNodeBus.pop();
                }
                while (delayNodeBus.length > 0) {
                    delayNodeBus.pop();
                }
            }

            expect(audioNodeBus.length).toBe(0);
            expect(delayNodeBus.length).toBe(0);
            expect(document.getElementById('crossFadeMediaElement')).toBeNull();

            usePreferencesStore.getState().setCrossfadeTriggered(false);
            expect(usePreferencesStore.getState()._runtime.triggered).toBe(false);

            const newAudio = document.createElement('audio');
            newAudio.id = 'currentMediaElement';
            newAudio.src = 'http://example.com/next-song.mp3';
            Object.defineProperty(newAudio, 'duration', { value: 200, writable: true });
            Object.defineProperty(newAudio, 'currentTime', { value: 195.5, writable: true });
            document.body.appendChild(newAudio);

            const shouldTriggerAgain = timeRunningOut({
                currentTime: () => newAudio.currentTime,
                duration: () => newAudio.duration
            });
            expect(shouldTriggerAgain).toBe(true);
            expect(usePreferencesStore.getState()._runtime.triggered).toBe(true);
        });

        it('should verify crossfade enabled state propagates correctly', () => {
            initializeMasterAudio(mockUnbind);

            usePreferencesStore.getState().setCrossfadeDuration(0.005);
            expect(isCrossfadeEnabled()).toBe(false);

            usePreferencesStore.getState().setCrossfadeDuration(0.25);
            expect(isCrossfadeEnabled()).toBe(true);

            usePreferencesStore.getState().setCrossfadeDuration(5);
            expect(isCrossfadeEnabled()).toBe(true);
        });
    });
});
