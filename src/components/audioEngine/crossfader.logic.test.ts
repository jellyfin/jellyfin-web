import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as userSettings from '../../scripts/settings/userSettings';

// Mock all dependencies
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

vi.mock('components/visualizer/visualizers.logic', () => ({
    getSavedVisualizerSettings: vi.fn(() => ({
        waveSurfer: { enabled: false },
        frequencyAnalyzer: { enabled: false },
        butterchurn: { enabled: false }
    })),
    setVisualizerSettings: vi.fn(),
    visualizerSettings: {
        waveSurfer: { enabled: false },
        frequencyAnalyzer: { enabled: false },
        butterchurn: { enabled: false }
    }
}));

vi.mock('../../scripts/settings/userSettings', () => ({
    crossfadeDuration: vi.fn(() => 5)
}));

const mocks = vi.hoisted(() => ({
    masterAudioOutput: {
        audioContext: { currentTime: 0 },
        mixerNode: null
    }
}));

vi.mock('./master.logic', () => ({
    audioNodeBus: [],
    delayNodeBus: [],
    masterAudioOutput: mocks.masterAudioOutput,
    unbindCallback: null
}));

// Import after mocks are set up
import {
    setXDuration,
    xDuration,
    timeRunningOut,
    cancelCrossfadeTimeouts,
    syncManager
} from './crossfader.logic';

// Setup fake timers
beforeEach(() => {
    vi.useFakeTimers();
    xDuration.busy = false;
    xDuration.enabled = true;
    xDuration.fadeOut = 1;
    xDuration.sustain = 0.45;
    xDuration.triggered = false; // Reset triggered flag to prevent state pollution
    mocks.masterAudioOutput.audioContext = { currentTime: 0 };
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    syncManager.stopSync();
    vi.advanceTimersByTime(200);
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
});

describe('crossfader.logic - setXDuration', () => {
    describe('disabled mode (duration < 0.01)', () => {
        it('should disable crossfade when duration < 0.01', () => {
            setXDuration(0.005);
            expect(xDuration.enabled).toBe(false);
        });

        it('should set fadeOut to 0 when disabled', () => {
            setXDuration(0.005);
            expect(xDuration.fadeOut).toBe(0);
        });

        it('should set sustain to 0 when disabled', () => {
            setXDuration(0.005);
            expect(xDuration.sustain).toBe(0);
        });
    });

    describe('short mode (0.01 <= duration <= 0.5)', () => {
        it('should enable crossfade for short duration', () => {
            setXDuration(0.25);
            expect(xDuration.enabled).toBe(true);
        });

        it('should set fadeOut equal to duration', () => {
            setXDuration(0.25);
            expect(xDuration.fadeOut).toBe(0.25);
        });

        it('should set sustain to duration / 2', () => {
            setXDuration(0.25);
            expect(xDuration.sustain).toBe(0.125);
        });

        it('should handle boundary case at 0.01', () => {
            setXDuration(0.01);
            expect(xDuration.enabled).toBe(true);
            expect(xDuration.fadeOut).toBe(0.01);
        });

        it('should handle boundary case at 0.5', () => {
            setXDuration(0.5);
            expect(xDuration.enabled).toBe(true);
            expect(xDuration.fadeOut).toBe(0.5);
        });

        it('should handle mid-range duration (0.3)', () => {
            setXDuration(0.3);
            expect(xDuration.fadeOut).toBe(0.3);
            expect(xDuration.sustain).toBe(0.15);
        });

        it('should handle mid-range duration (0.15)', () => {
            setXDuration(0.15);
            expect(xDuration.fadeOut).toBe(0.15);
            expect(xDuration.sustain).toBe(0.075);
        });
    });

    describe('full mode (duration > 0.5)', () => {
        it('should enable crossfade for long duration', () => {
            setXDuration(5);
            expect(xDuration.enabled).toBe(true);
        });

        it('should set fadeOut to duration * 2', () => {
            setXDuration(5);
            expect(xDuration.fadeOut).toBe(10);
        });

        it('should set sustain to duration / 12', () => {
            setXDuration(5);
            expect(xDuration.sustain).toBe(5 / 12);
        });

        it('should handle boundary case at 0.51', () => {
            setXDuration(0.51);
            expect(xDuration.enabled).toBe(true);
            expect(xDuration.fadeOut).toBe(1.02);
        });

        it('should handle large duration (12s)', () => {
            setXDuration(12);
            expect(xDuration.fadeOut).toBe(24);
            expect(xDuration.sustain).toBe(1);
        });
    });
});

describe('crossfader.logic - timeRunningOut', () => {
    describe('guard clauses', () => {
        it('should return false when audioContext not initialized', () => {
            const mockPlayer = {
                currentTime: () => 1000,
                duration: () => 100000
            };
            expect(timeRunningOut(mockPlayer)).toBe(false);
        });

        it('should return false when crossfade disabled', () => {
            xDuration.enabled = false;

            const mockPlayer = {
                currentTime: () => 1000,
                duration: () => 100000
            };
            expect(timeRunningOut(mockPlayer)).toBe(false);
        });

        it('should return false when crossfade busy', () => {
            xDuration.enabled = true;
            xDuration.busy = true;

            const mockPlayer = {
                currentTime: () => 1000,
                duration: () => 100000
            };
            expect(timeRunningOut(mockPlayer)).toBe(false);
        });

        it('should return false when current time below fadeOut threshold', () => {
            xDuration.enabled = true;
            xDuration.busy = false;
            xDuration.fadeOut = 5;

            const mockPlayer = {
                currentTime: () => 1000,
                duration: () => 100000
            };
            expect(timeRunningOut(mockPlayer)).toBe(false);
        });
    });

    describe('threshold detection', () => {
        beforeEach(() => {
            xDuration.enabled = true;
            xDuration.busy = false;
            xDuration.fadeOut = 10; // 10 seconds fadeOut
        });

        // Note: player.currentTime() and duration() return SECONDS
        // The function multiplies by 1000 to convert to milliseconds

        it('should detect when time running out (just within threshold)', () => {
            // 85s into 100s track, fadeOut=10s means threshold at 85s (100-10*1.5=85)
            const mockPlayer = {
                currentTime: () => 85,
                duration: () => 100
            };
            expect(timeRunningOut(mockPlayer)).toBe(true);
        });

        it('should detect when time running out (well within threshold)', () => {
            // 95s into 100s track, well within fadeOut window
            const mockPlayer = {
                currentTime: () => 95,
                duration: () => 100
            };
            expect(timeRunningOut(mockPlayer)).toBe(true);
        });

        it('should not trigger when just outside threshold', () => {
            // 84s into 100s track, just outside fadeOut*1.5 threshold (16s remaining > 15s)
            const mockPlayer = {
                currentTime: () => 84,
                duration: () => 100
            };
            expect(timeRunningOut(mockPlayer)).toBe(false);
        });

        it('should handle zero remaining time', () => {
            // At exact end of track
            const mockPlayer = {
                currentTime: () => 100,
                duration: () => 100
            };
            expect(timeRunningOut(mockPlayer)).toBe(true);
        });

        it('should work with short fadeOut duration', () => {
            xDuration.fadeOut = 1; // 1 second fadeOut
            // 98.5s into 100s track, 1.5s remaining <= 1*1.5=1.5s threshold
            const mockPlayer = {
                currentTime: () => 98.5,
                duration: () => 100
            };
            expect(timeRunningOut(mockPlayer)).toBe(true);
        });

        it('should work with long fadeOut duration', () => {
            xDuration.fadeOut = 30; // 30 second fadeOut
            // 55s into 100s track, 45s remaining <= 30*1.5=45s threshold
            const mockPlayer = {
                currentTime: () => 55,
                duration: () => 100
            };
            expect(timeRunningOut(mockPlayer)).toBe(true);
        });
    });
});

describe('crossfader.logic - cancelCrossfadeTimeouts', () => {
    it('should be safe to call multiple times', () => {
        expect(() => {
            cancelCrossfadeTimeouts();
            cancelCrossfadeTimeouts();
        }).not.toThrow();
    });

    it('should reset busy and triggered flags', () => {
        xDuration.busy = true;
        xDuration.triggered = true;
        xDuration.manualTrigger = true;
        cancelCrossfadeTimeouts();
        expect(xDuration.busy).toBe(false);
        expect(xDuration.triggered).toBe(false);
        expect(xDuration.manualTrigger).toBe(false);
    });
});

describe('crossfader.logic - timeRunningOut race condition', () => {
    beforeEach(() => {
        xDuration.enabled = true;
        xDuration.busy = false;
        xDuration.fadeOut = 10;
        mocks.masterAudioOutput.audioContext = { currentTime: 0 };
    });

    it('should trigger when approaching end of track', () => {
        const mockPlayer = {
            currentTime: () => 90,
            duration: () => 100
        };

        const result = timeRunningOut(mockPlayer);
        expect(result).toBe(true);
    });

    it('should not trigger when well before end of track', () => {
        const mockPlayer = {
            currentTime: () => 50,
            duration: () => 100
        };

        const result = timeRunningOut(mockPlayer);
        expect(result).toBe(false);
    });

    it('should not trigger when crossfade is disabled', () => {
        xDuration.enabled = false;
        const mockPlayer = {
            currentTime: () => 90,
            duration: () => 100
        };

        const result = timeRunningOut(mockPlayer);
        expect(result).toBe(false);
    });

    it('should not trigger when crossfade is busy', () => {
        xDuration.busy = true;
        const mockPlayer = {
            currentTime: () => 90,
            duration: () => 100
        };

        const result = timeRunningOut(mockPlayer);
        expect(result).toBe(false);
    });
});

describe('crossfader.logic - SyncManager', () => {
    let mockElement1: HTMLAudioElement;
    let mockElement2: HTMLAudioElement;

    beforeEach(() => {
        syncManager.stopSync();
        // Create mock elements
        mockElement1 = document.createElement('audio');
        mockElement2 = document.createElement('audio');

        // Setup element properties
        Object.defineProperty(mockElement1, 'currentTime', { value: 10, writable: true, configurable: true });
        Object.defineProperty(mockElement1, 'paused', { value: false, writable: true, configurable: true });
        Object.defineProperty(mockElement1, 'readyState', { value: 4, writable: true, configurable: true });
        Object.defineProperty(mockElement1, 'playbackRate', { value: 1.0, writable: true, configurable: true });
        Object.defineProperty(mockElement1, 'buffered', {
            value: {
                length: 1,
                end: vi.fn(() => 15)
            },
            writable: true,
            configurable: true
        });

        Object.defineProperty(mockElement2, 'currentTime', { value: 12, writable: true, configurable: true });
        Object.defineProperty(mockElement2, 'paused', { value: false, writable: true, configurable: true });
        Object.defineProperty(mockElement2, 'readyState', { value: 4, writable: true, configurable: true });
        Object.defineProperty(mockElement2, 'playbackRate', { value: 1.0, writable: true, configurable: true });
        Object.defineProperty(mockElement2, 'buffered', {
            value: {
                length: 1,
                end: vi.fn(() => 18)
            },
            writable: true,
            configurable: true
        });
    });

    afterEach(() => {
        syncManager.stopSync();
        vi.clearAllMocks();
    });

    describe('registerElement and unregisterElement', () => {
        it('should register an element with start time', () => {
            syncManager.registerElement(mockElement1, 5);
            expect(mockElement1.preload).toBe('auto');
        });

        it('should unregister an element', () => {
            syncManager.registerElement(mockElement1, 5);
            syncManager.unregisterElement(mockElement1);
            // No direct way to test internal map, but no errors should occur
        });
    });

    describe('startSync and stopSync', () => {
        let setIntervalSpy: any;
        let clearIntervalSpy: any;

        beforeEach(() => {
            setIntervalSpy = vi.spyOn(global, 'setInterval').mockImplementation(() => { return 1 as unknown as ReturnType<typeof setInterval>; });
            clearIntervalSpy = vi.spyOn(global, 'clearInterval').mockImplementation(() => {});
        });

        afterEach(() => {
            syncManager.stopSync();
            setIntervalSpy.mockRestore();
            clearIntervalSpy.mockRestore();
        });

        it('should start sync interval', () => {
            syncManager.startSync();
            expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 100);
        });

        it('should not start multiple intervals', () => {
            syncManager.startSync();
            syncManager.startSync();
            expect(setIntervalSpy).toHaveBeenCalledTimes(1);
        });

        it('should stop sync interval', () => {
            syncManager.startSync();
            syncManager.stopSync();
            expect(clearIntervalSpy).toHaveBeenCalled();
        });

        it('should handle stopSync when no interval', () => {
            syncManager.stopSync();
            expect(clearIntervalSpy).not.toHaveBeenCalled();
        });
    });

    describe('getBufferedAhead', () => {
        it('should return buffered ahead time', () => {
            const bufferedAhead = syncManager.getBufferedAhead(mockElement1);
            expect(bufferedAhead).toBe(5); // 15 - 10
        });

        it('should return 0 for no buffered ranges', () => {
            Object.defineProperty(mockElement1, 'buffered', {
                value: { length: 0, end: vi.fn(() => 0) },
                writable: true,
                configurable: true
            });
            const bufferedAhead = syncManager.getBufferedAhead(mockElement1);
            expect(bufferedAhead).toBe(0);
        });
    });
});
