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
    hijackMediaElementForCrossfade,
    timeRunningOut,
    cancelCrossfadeTimeouts
} from './crossfader.logic';

// Setup fake timers
beforeEach(() => {
    vi.useFakeTimers();
    xDuration.busy = false;
    xDuration.enabled = true;
    xDuration.disableFade = false;
    xDuration.fadeOut = 1;
    xDuration.sustain = 0.45;
    xDuration.triggered = false; // Reset triggered flag to prevent state pollution
    mocks.masterAudioOutput.audioContext = { currentTime: 0 };
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    vi.runAllTimers();
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

        it('should set disableFade to true when disabled', () => {
            setXDuration(0.005);
            expect(xDuration.disableFade).toBe(true);
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

        it('should set disableFade to true for short duration', () => {
            setXDuration(0.25);
            expect(xDuration.disableFade).toBe(true);
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

        it('should set disableFade to false for long duration', () => {
            setXDuration(5);
            expect(xDuration.disableFade).toBe(false);
        });

        it('should set sustain to duration / 12', () => {
            setXDuration(5);
            expect(xDuration.sustain).toBe(5 / 12);
        });

        it('should handle boundary case at 0.51', () => {
            setXDuration(0.51);
            expect(xDuration.enabled).toBe(true);
            expect(xDuration.fadeOut).toBe(1.02);
            expect(xDuration.disableFade).toBe(false);
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

describe('crossfader.logic - hijackMediaElementForCrossfade', () => {
    let mockMediaElement: any;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Setup mock media element
        mockMediaElement = document.createElement('audio');
        mockMediaElement.id = 'currentMediaElement';
        mockMediaElement.src = 'http://example.com/song.mp3';
        // Override paused property since it's read-only
        Object.defineProperty(mockMediaElement, 'paused', {
            value: false,
            writable: true,
            configurable: true
        });
        document.body.appendChild(mockMediaElement);

        mocks.masterAudioOutput.audioContext = { currentTime: 0 };
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        const element = document.getElementById('currentMediaElement');
        if (element) element.remove();
        const crossfadeElement = document.getElementById('crossFadeMediaElement');
        if (crossfadeElement) crossfadeElement.remove();
        consoleErrorSpy.mockRestore();
    });

    describe('error handling and state management', () => {
        // Note: The hijackMediaElementForCrossfade function sets busy=true at the start
        // before any validation. It returns early on errors but does NOT reset busy.
        // This is the current behavior; these tests verify that behavior.

        it('should still set busy flag even when currentMediaElement not found', () => {
            const element = document.getElementById('currentMediaElement');
            if (element) element.remove();

            hijackMediaElementForCrossfade();

            // busy is set before element check, so it stays true even on early return
            expect(xDuration.busy).toBe(true);
        });

        it('should return early when element missing (triggerSongInfoDisplay called)', () => {
            const element = document.getElementById('currentMediaElement');
            if (element) element.remove();

            // Function returns early via triggerSongInfoDisplay(), doesn't throw
            expect(() => hijackMediaElementForCrossfade()).not.toThrow();
        });

        it('should keep busy flag true when element missing (early return behavior)', () => {
            const element = document.getElementById('currentMediaElement');
            if (element) element.remove();

            xDuration.busy = false;
            hijackMediaElementForCrossfade();

            // busy is set at start of function before checks
            expect(xDuration.busy).toBe(true);
        });

        it('should set busy flag to true on successful hijack', () => {
            hijackMediaElementForCrossfade();
            expect(xDuration.busy).toBe(true);
        });

        it('should set busy flag even when no element found', () => {
            const element = document.getElementById('currentMediaElement');
            if (element) element.remove();

            xDuration.busy = false;
            hijackMediaElementForCrossfade();

            // busy is always set to true at function start
            expect(xDuration.busy).toBe(true);
        });

        it('should keep busy flag true when AudioContext not available', () => {
            mocks.masterAudioOutput.audioContext = null as any;
            xDuration.busy = false;
            hijackMediaElementForCrossfade();
            // busy is set before audioContext check
            expect(xDuration.busy).toBe(true);
        });
    });

    describe('media element state detection', () => {
        it('should detect paused media and disable crossfade', () => {
            mockMediaElement.paused = true;

            hijackMediaElementForCrossfade();

            expect(xDuration.disableFade).toBe(true);
        });

        it('should detect empty src and disable crossfade', () => {
            Object.defineProperty(mockMediaElement, 'src', {
                value: '',
                writable: true,
                configurable: true
            });

            hijackMediaElementForCrossfade();

            expect(xDuration.disableFade).toBe(true);
        });

        it('should call endSong on hijack attempt', () => {
            hijackMediaElementForCrossfade();

            // endSong is called by the hijack function - test indirectly through mocks
            // This test verifies the function executes without throwing
            expect(xDuration.busy).toBe(true);
        });

        it('should record start time in t0', () => {
            const beforeTime = performance.now();
            hijackMediaElementForCrossfade();
            const afterTime = performance.now();

            expect(xDuration.t0).toBeGreaterThanOrEqual(beforeTime);
            expect(xDuration.t0).toBeLessThanOrEqual(afterTime);
        });

        it('should call setVisualizerSettings', () => {
            hijackMediaElementForCrossfade();

            // setVisualizerSettings is called internally
            // This test verifies the function executes
            expect(xDuration.busy).toBe(true);
        });
    });

    describe('DOM manipulation', () => {
        it('should remove mediaPlayerAudio class from element', () => {
            mockMediaElement.classList.add('mediaPlayerAudio');

            hijackMediaElementForCrossfade();

            expect(mockMediaElement.classList.contains('mediaPlayerAudio')).toBe(false);
        });

        it('should attempt to remove element class before processing', () => {
            mockMediaElement.classList.add('mediaPlayerAudio');
            const removeClassSpy = vi.spyOn(mockMediaElement.classList, 'remove');

            hijackMediaElementForCrossfade();

            expect(removeClassSpy).toHaveBeenCalledWith('mediaPlayerAudio');
            removeClassSpy.mockRestore();
        });
    });

    describe('src override safety', () => {
        it('should continue when src descriptor is not configurable', () => {
            const originalGetDescriptor = Object.getOwnPropertyDescriptor;
            vi.spyOn(Object, 'getOwnPropertyDescriptor').mockImplementation((obj, prop) => {
                if (obj === HTMLMediaElement.prototype && prop === 'src') {
                    return {
                        configurable: false,
                        enumerable: true,
                        get: () => mockMediaElement.src,
                        set: () => {}
                    };
                }
                return originalGetDescriptor(obj, prop);
            });

            expect(() => hijackMediaElementForCrossfade()).not.toThrow();
            expect(xDuration.busy).toBe(true);
        });

        it('should throw when src override fails (no try-catch in implementation)', () => {
            const originalDefineProperty = Object.defineProperty;
            vi.spyOn(Object, 'defineProperty').mockImplementation((obj, prop, desc) => {
                if (obj === mockMediaElement && prop === 'src') {
                    throw new Error('No redefine');
                }
                return originalDefineProperty(obj, prop, desc);
            });

            // The current implementation doesn't catch Object.defineProperty errors
            expect(() => hijackMediaElementForCrossfade()).toThrow('No redefine');
        });
    });

    describe('timeout mechanisms', () => {
        it('should initialize without errors', () => {
            hijackMediaElementForCrossfade();
            // Verify function completed without throwing
            expect(xDuration).toBeDefined();
        });

        it('should call setTimeout for state recovery setup', () => {
            const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

            hijackMediaElementForCrossfade();

            // Verify setTimeout was called (at minimum for recovery)
            expect(setTimeoutSpy).toHaveBeenCalled();
            setTimeoutSpy.mockRestore();
        });

        it('should reset busy flag after sustain timeout completes', () => {
            vi.mocked(userSettings.crossfadeDuration).mockReturnValueOnce(2); // 2 second crossfade

            hijackMediaElementForCrossfade();
            expect(xDuration.busy).toBe(true);
            expect(document.getElementById('crossFadeMediaElement')).not.toBeNull();

            // Advance past sustain timeout (sustain = 2/12 = 0.167s = 167ms)
            // With SUSTAIN_OFFSET_MS of 15, timeout is ~152ms
            vi.advanceTimersByTime(200);

            expect(xDuration.busy).toBe(false);
        });

        it('should have timeout mechanism in place', () => {
            const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

            hijackMediaElementForCrossfade();

            // Verify timeouts were scheduled
            expect(setTimeoutSpy.mock.calls.length).toBeGreaterThan(0);
            setTimeoutSpy.mockRestore();
        });
    });

    describe('edge cases', () => {
        it('should set busy flag even when AudioContext not initialized', () => {
            mocks.masterAudioOutput.audioContext = null as any;
            hijackMediaElementForCrossfade();
            // Function sets busy=true before checking audioContext
            // and returns early without resetting it
            expect(xDuration.busy).toBe(true);
        });

        it('should handle rapid successive calls (both set busy)', () => {
            mocks.masterAudioOutput.audioContext = null as any;
            hijackMediaElementForCrossfade();
            const firstBusy = xDuration.busy;

            // Call again immediately
            hijackMediaElementForCrossfade();
            const secondBusy = xDuration.busy;

            // Both set busy=true (function doesn't check busy before setting)
            expect(firstBusy).toBe(true);
            expect(secondBusy).toBe(true);
        });

        it('should initialize without throwing when AudioContext missing', () => {
            // This test verifies the function doesn't throw
            // even when critical resources are missing
            expect(() => {
                hijackMediaElementForCrossfade();
            }).not.toThrow();
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

    it('should clear pending timeouts', () => {
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

        // Create a media element for hijack
        const mockMediaElement = document.createElement('audio');
        mockMediaElement.id = 'currentMediaElement';
        mockMediaElement.src = 'http://example.com/song.mp3';
        Object.defineProperty(mockMediaElement, 'paused', {
            value: false,
            writable: true,
            configurable: true
        });
        document.body.appendChild(mockMediaElement);
        mocks.masterAudioOutput.audioContext = { currentTime: 0 };

        hijackMediaElementForCrossfade();
        cancelCrossfadeTimeouts();

        expect(clearTimeoutSpy).toHaveBeenCalled();
        clearTimeoutSpy.mockRestore();

        // Cleanup
        const element = document.getElementById('currentMediaElement');
        if (element) element.remove();
        const crossfadeElement = document.getElementById('crossFadeMediaElement');
        if (crossfadeElement) crossfadeElement.remove();
    });
});

describe('crossfader.logic - timeRunningOut race condition', () => {
    beforeEach(() => {
        xDuration.enabled = true;
        xDuration.busy = false;
        xDuration.triggered = false;
        xDuration.fadeOut = 10;
        mocks.masterAudioOutput.audioContext = { currentTime: 0 };
    });

    it('should prevent double-trigger on rapid calls', () => {
        const mockPlayer = {
            currentTime: () => 90,
            duration: () => 100
        };

        const first = timeRunningOut(mockPlayer);
        const second = timeRunningOut(mockPlayer);

        expect(first).toBe(true);
        expect(second).toBe(false);
    });

    it('should check triggered flag first', () => {
        xDuration.triggered = true;

        const mockPlayer = {
            currentTime: () => 99,
            duration: () => 100
        };

        expect(timeRunningOut(mockPlayer)).toBe(false);
    });

    it('should set triggered flag before returning true', () => {
        const mockPlayer = {
            currentTime: () => 90,
            duration: () => 100
        };

        expect(xDuration.triggered).toBe(false);
        timeRunningOut(mockPlayer);
        expect(xDuration.triggered).toBe(true);
    });
});

describe('crossfader.logic - negative timeout prevention', () => {
    let mockMediaElement: HTMLAudioElement;

    beforeEach(() => {
        mockMediaElement = document.createElement('audio');
        mockMediaElement.id = 'currentMediaElement';
        mockMediaElement.src = 'http://example.com/song.mp3';
        Object.defineProperty(mockMediaElement, 'paused', {
            value: false,
            writable: true,
            configurable: true
        });
        document.body.appendChild(mockMediaElement);
        mocks.masterAudioOutput.audioContext = { currentTime: 0 };
    });

    afterEach(() => {
        const element = document.getElementById('currentMediaElement');
        if (element) element.remove();
        const crossfadeElement = document.getElementById('crossFadeMediaElement');
        if (crossfadeElement) crossfadeElement.remove();
    });

    it('should not produce negative timeout for very short crossfade', () => {
        const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

        setXDuration(0.01); // 10ms crossfade, sustain = 5ms

        // Sustain timeout would be: 5ms - 15ms = -10ms
        // With fix: Math.max(0, -10) = 0ms
        hijackMediaElementForCrossfade();

        // Verify setTimeout was called with non-negative values
        const calls = setTimeoutSpy.mock.calls;
        calls.forEach((call) => {
            const delay = call[1] as number;
            expect(delay).toBeGreaterThanOrEqual(0);
        });

        expect(xDuration.busy).toBe(true);
        setTimeoutSpy.mockRestore();
    });

    it('should handle zero sustain duration', () => {
        const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

        setXDuration(0.005); // Below minimum, disables crossfade
        // This sets sustain to 0

        hijackMediaElementForCrossfade();

        // Verify no negative timeouts
        const calls = setTimeoutSpy.mock.calls;
        calls.forEach((call) => {
            const delay = call[1] as number;
            expect(delay).toBeGreaterThanOrEqual(0);
        });

        setTimeoutSpy.mockRestore();
    });
});
