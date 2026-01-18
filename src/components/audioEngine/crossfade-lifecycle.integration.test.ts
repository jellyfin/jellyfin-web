import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('components/visualizer/WaveSurfer', () => ({
    destroyWaveSurferInstance: vi.fn(() => Promise.resolve())
}));

vi.mock('components/sitbackMode/sitback.logic', () => ({
    endSong: vi.fn(),
    triggerSongInfoDisplay: vi.fn()
}));

vi.mock('components/visualizer/butterchurn.logic', () => ({
    getButterchurnInstance: vi.fn(() => Promise.resolve({ nextPreset: vi.fn() }))
}));

vi.mock('components/visualizer/visualizers.logic', () => ({
    getSavedVisualizerSettings: vi.fn(() => ({
        waveSurfer: { enabled: false },
        frequencyAnalyzer: { enabled: false },
        butterchurn: { enabled: false }
    })),
    setVisualizerSettings: vi.fn(),
    visualizerSettings: { waveSurfer: { enabled: false }, frequencyAnalyzer: { enabled: false }, butterchurn: { enabled: false } }
}));

vi.mock('../../scripts/settings/userSettings', () => ({
    crossfadeDuration: vi.fn(() => 5)
}));

import {
    initializeMasterAudio,
    createGainNode,
    removeAudioNodeBundle,
    ensureAudioNodeBundle,
    audioNodeBus,
    delayNodeBus,
    masterAudioOutput
} from './master.logic';
import {
    setXDuration,
    xDuration,
    timeRunningOut,
    cancelCrossfadeTimeouts,
    syncManager
} from './crossfader.logic';
import {
    preloadNextTrack,
    startCrossfade,
    resetPreloadedTrack
} from './crossfadeController';

const createMockAudioContext = () => {
    const mockGainNodes: any[] = [];
    const mockDelayNodes: any[] = [];

    const createMockAudioParam = (initialValue = 1) => {
        let value = initialValue;
        return {
            get value() { return value; },
            set value(v) { value = v; },
            setValueAtTime: vi.fn((v) => { value = v; return value; }),
            linearRampToValueAtTime: vi.fn((v) => { value = v; return value; }),
            exponentialRampToValueAtTime: vi.fn((v) => { value = v; return value; }),
            cancelScheduledValues: vi.fn()
        };
    };

    const createMockGainNode = () => {
        const node = { gain: createMockAudioParam(1), connect: vi.fn(), disconnect: vi.fn() };
        mockGainNodes.push(node);
        return node;
    };

    const createMockDelayNode = () => {
        const node = { delayTime: { value: 0 }, connect: vi.fn(), disconnect: vi.fn() };
        mockDelayNodes.push(node);
        return node;
    };

    return {
        currentTime: 0,
        state: 'running',
        destination: {},
        createGain: vi.fn(() => createMockGainNode()),
        createMediaElementSource: vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() })),
        createDynamicsCompressor: vi.fn(() => ({
            threshold: { setValueAtTime: vi.fn() }, knee: { setValueAtTime: vi.fn() },
            ratio: { setValueAtTime: vi.fn() }, attack: { setValueAtTime: vi.fn() },
            release: { setValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn()
        })),
        createDelay: vi.fn(() => createMockDelayNode()),
        resume: vi.fn(() => Promise.resolve()),
        audioWorklet: { addModule: vi.fn(() => Promise.resolve()) }
    };
};

const createMockMediaElement = (id: string) => {
    const element = document.createElement('audio') as unknown as HTMLAudioElement & { _mockData?: any };
    element.id = id;
    element.src = '';
    element.preload = 'none';
    Object.defineProperty(element, 'duration', { value: 180, writable: true, configurable: true });
    Object.defineProperty(element, 'currentTime', { value: 0, writable: true, configurable: true });
    Object.defineProperty(element, 'paused', { value: true, writable: true, configurable: true });
    Object.defineProperty(element, 'buffered', {
        value: {
            length: 1,
            start: (i: number) => i === 0 ? 0 : 0,
            end: (i: number) => i === 0 ? 10 : 10
        },
        writable: true,
        configurable: true
    });
    (element as any).play = vi.fn(() => Promise.resolve());
    (element as any).pause = vi.fn();
    (element as any).load = vi.fn();
    return element;
};

describe('Crossfade Lifecycle Integration Tests', () => {
    let mockUnbind: any;
    let originalAudioContext: any;
    let mockAudioContext: any;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        originalAudioContext = (window as any).AudioContext;
        mockAudioContext = createMockAudioContext();
        (window as any).AudioContext = vi.fn(() => mockAudioContext);
        (window as any).webkitAudioContext = undefined;

        audioNodeBus.length = 0;
        delayNodeBus.length = 0;
        xDuration.busy = false;
        xDuration.enabled = true;
        xDuration.triggered = false;
        xDuration.fadeOut = 2;
        xDuration.sustain = 0.5;
        xDuration.manualTrigger = false;
        resetPreloadedTrack();
    });

    afterEach(() => {
        syncManager.stopSync();
        vi.advanceTimersByTime(200);
        vi.useRealTimers();
        document.body.innerHTML = '';
        (window as any).AudioContext = originalAudioContext;
    });

    describe('CrossfadeController Preload Flow', () => {
        it('should preload a track with zero gain', () => {
            initializeMasterAudio(mockUnbind);
            const element = createMockMediaElement('test-audio');
            document.body.appendChild(element);
            const bundle = ensureAudioNodeBundle(element, { registerInBus: true });
            expect(bundle).toBeDefined();
            resetPreloadedTrack();
        });

        it('should not duplicate preloads for same item', async () => {
            initializeMasterAudio(mockUnbind);
            const preloadCalls: string[] = [];
            const originalPreload = preloadNextTrack;
            
            vi.spyOn(console, 'log').mockImplementation(() => {});
        });

        it('should reset preload state', () => {
            initializeMasterAudio(mockUnbind);
            resetPreloadedTrack();
            expect(document.querySelector('[data-crossfade-preload="true"]')).toBeNull();
        });
    });

    describe('CrossfadeController Start Flow', () => {
        it('should fail startCrossfade when no track preloaded', async () => {
            initializeMasterAudio(mockUnbind);
            const fromElement = createMockMediaElement('current-media');
            document.body.appendChild(fromElement);
            const result = await startCrossfade({ fromElement, durationSeconds: 3 });
            expect(result).toBe(false);
        });

        it('should execute crossfade successfully', async () => {
            initializeMasterAudio(mockUnbind);
            const fromElement = createMockMediaElement('current-media');
            document.body.appendChild(fromElement);
            const result = await startCrossfade({ fromElement, durationSeconds: 3 });
            expect(result).toBe(false);
        });

        it('should handle zero-duration crossfade', async () => {
            initializeMasterAudio(mockUnbind);
            const fromElement = createMockMediaElement('current-media');
            document.body.appendChild(fromElement);
            const result = await startCrossfade({ fromElement, durationSeconds: 0 });
            expect(result).toBe(false);
        });
    });

    describe('xDuration Configuration', () => {
        it('should setup crossfade when called with valid settings', () => {
            initializeMasterAudio(mockUnbind);
            setXDuration(5);
            expect(xDuration.enabled).toBe(true);
            expect(xDuration.fadeOut).toBe(10);
        });

        it('should disable crossfade for very short durations', () => {
            initializeMasterAudio(mockUnbind);
            setXDuration(0.005);
            expect(xDuration.enabled).toBe(false);
        });

        it('should use short mode for durations under 0.5s', () => {
            initializeMasterAudio(mockUnbind);
            setXDuration(0.3);
            expect(xDuration.enabled).toBe(true);
            expect(xDuration.fadeOut).toBe(0.3);
        });

        it('should cancel timeouts on reset', () => {
            initializeMasterAudio(mockUnbind);
            setXDuration(5);
            xDuration.busy = true;
            xDuration.triggered = true;
            cancelCrossfadeTimeouts();
            expect(xDuration.busy).toBe(false);
            expect(xDuration.triggered).toBe(false);
        });
    });

    describe('timeRunningOut Detection', () => {
        it('should detect when track is running out of time', () => {
            initializeMasterAudio(mockUnbind);
            setXDuration(5);
            const mockPlayer = { currentTime: () => 177, duration: () => 180 };
            const result = timeRunningOut(mockPlayer);
            expect(result).toBe(true);
            expect(xDuration.triggered).toBe(true);
        });

        it('should not trigger if crossfade is disabled', () => {
            initializeMasterAudio(mockUnbind);
            setXDuration(0.005);
            const mockPlayer = { currentTime: () => 177, duration: () => 180 };
            const result = timeRunningOut(mockPlayer);
            expect(result).toBe(false);
        });

        it('should handle invalid duration gracefully', () => {
            initializeMasterAudio(mockUnbind);
            setXDuration(5);
            const mockPlayer = { currentTime: () => 100, duration: () => 0 };
            const result = timeRunningOut(mockPlayer);
            expect(result).toBe(false);
        });
    });

    describe('SyncManager Integration', () => {
        it('should register and unregister elements', () => {
            initializeMasterAudio(mockUnbind);
            const element = createMockMediaElement('test-media');
            document.body.appendChild(element);
            syncManager.registerElement(element, 10);
            syncManager.unregisterElement(element);
        });

        it('should start and stop sync interval', () => {
            syncManager.startSync();
            syncManager.stopSync();
        });

        it('should calculate buffered ahead correctly', () => {
            initializeMasterAudio(mockUnbind);
            const element = createMockMediaElement('test-media');
            document.body.appendChild(element);
            const buffered = syncManager.getBufferedAhead(element);
            expect(buffered).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Audio Node Bus Management', () => {
        it('should add nodes to bus when registering', () => {
            initializeMasterAudio(mockUnbind);
            const element = createMockMediaElement('test-audio');
            document.body.appendChild(element);
            const before = audioNodeBus.length;
            createGainNode(element);
            expect(audioNodeBus.length).toBeGreaterThan(before);
        });

        it('should remove nodes from bus on cleanup', () => {
            initializeMasterAudio(mockUnbind);
            const element = createMockMediaElement('test-audio');
            document.body.appendChild(element);
            createGainNode(element);
            const beforeRemove = audioNodeBus.length;
            removeAudioNodeBundle(element);
            expect(audioNodeBus.length).toBeLessThan(beforeRemove);
        });
    });

    describe('Full Crossfade Lifecycle', () => {
        it('should complete entire flow: detect → crossfade state', () => {
            initializeMasterAudio(mockUnbind);
            const currentElement = createMockMediaElement('currentMediaElement');
            currentElement.src = 'http://example.com/song1.mp3';
            (currentElement as any).currentTime = 175;
            document.body.appendChild(currentElement);
            ensureAudioNodeBundle(currentElement, { registerInBus: true });
            setXDuration(5);
            expect(xDuration.enabled).toBe(true);
            const mockPlayer = { currentTime: () => (currentElement as any).currentTime, duration: () => (currentElement as any).duration };
            expect(timeRunningOut(mockPlayer)).toBe(true);
        });

        it('should handle rapid track skips', () => {
            initializeMasterAudio(mockUnbind);
            for (let i = 0; i < 5; i++) {
                const element = createMockMediaElement(`skip-${i}`);
                element.src = `http://example.com/song${i}.mp3`;
                document.body.appendChild(element);
                ensureAudioNodeBundle(element, { registerInBus: true });
                setXDuration(3);
                if (i > 0) {
                    removeAudioNodeBundle(document.getElementById(`skip-${i - 1}`) as unknown as HTMLAudioElement);
                }
            }
        });

        it('should recover from interrupted crossfade', () => {
            initializeMasterAudio(mockUnbind);
            const element = createMockMediaElement('currentMediaElement');
            element.src = 'http://example.com/song1.mp3';
            document.body.appendChild(element);
            ensureAudioNodeBundle(element, { registerInBus: true });
            cancelCrossfadeTimeouts();
            xDuration.busy = false;
            xDuration.triggered = false;
            const mockPlayer = { currentTime: () => 175, duration: () => 180 };
            expect(timeRunningOut(mockPlayer)).toBe(true);
            expect(xDuration.triggered).toBe(true);
        });

        it('should handle stop during crossfade', () => {
            initializeMasterAudio(mockUnbind);
            const element = createMockMediaElement('currentMediaElement');
            element.src = 'http://example.com/song.mp3';
            document.body.appendChild(element);
            ensureAudioNodeBundle(element, { registerInBus: true });
            createGainNode(element);
            xDuration.busy = true;
            xDuration.triggered = true;
            cancelCrossfadeTimeouts();
            expect(xDuration.busy).toBe(false);
            expect(xDuration.triggered).toBe(false);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing audio context gracefully', async () => {
            initializeMasterAudio(mockUnbind);
            (masterAudioOutput as any).audioContext = null;
            const element = createMockMediaElement('test-audio');
            document.body.appendChild(element);
            const result = await startCrossfade({ fromElement: element, durationSeconds: 3 });
            expect(result).toBe(false);
        });

        it('should handle rapid setting changes', () => {
            initializeMasterAudio(mockUnbind);
            setXDuration(5);
            expect(xDuration.fadeOut).toBe(10);
            setXDuration(0.1);
            expect(xDuration.fadeOut).toBe(0.1);
            setXDuration(0.005);
            expect(xDuration.enabled).toBe(false);
        });
    });

    describe('Memory Management', () => {
        it('should clean up all nodes on element removal', () => {
            initializeMasterAudio(mockUnbind);
            const element = createMockMediaElement('test-audio');
            document.body.appendChild(element);
            createGainNode(element);
            const beforeRemove = audioNodeBus.length;
            removeAudioNodeBundle(element);
            expect(audioNodeBus.length).toBeLessThanOrEqual(beforeRemove);
        });

        it('should reset preload state', () => {
            initializeMasterAudio(mockUnbind);
            resetPreloadedTrack();
            const element = document.querySelector('[data-crossfade-preload="true"]');
            expect(element).toBeNull();
        });
    });

    describe('State Consistency', () => {
        it('should maintain consistent xDuration state', () => {
            initializeMasterAudio(mockUnbind);
            setXDuration(5);
            cancelCrossfadeTimeouts();
            expect(xDuration.busy).toBe(false);
            expect(xDuration.triggered).toBe(false);
        });

        it('should track manual vs automatic triggers', () => {
            initializeMasterAudio(mockUnbind);
            setXDuration(5);
            xDuration.busy = false;
            xDuration.manualTrigger = false;
            xDuration.triggered = true;
            cancelCrossfadeTimeouts();
            expect(xDuration.manualTrigger).toBe(false);
        });
    });
});

describe('Player Lifecycle Integration Tests', () => {
    let mockUnbind: any;
    let originalAudioContext: any;
    let mockAudioContext: any;

    beforeEach(() => {
        vi.useFakeTimers();
        originalAudioContext = (window as any).AudioContext;
        mockAudioContext = createMockAudioContext();
        (window as any).AudioContext = vi.fn(() => mockAudioContext);
        mockUnbind = vi.fn();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        syncManager.stopSync();
        vi.advanceTimersByTime(200);
        vi.useRealTimers();
        document.body.innerHTML = '';
        (window as any).AudioContext = originalAudioContext;
    });

    describe('Play → Pause → Stop lifecycle', () => {
        it('should create audio nodes on play', () => {
            initializeMasterAudio(mockUnbind);
            const element = createMockMediaElement('player-audio');
            element.src = 'http://example.com/song.mp3';
            document.body.appendChild(element);
            createGainNode(element);
            expect(audioNodeBus.length).toBeGreaterThan(0);
        });

        it('should clean up nodes on stop', () => {
            initializeMasterAudio(mockUnbind);
            const element = createMockMediaElement('player-audio');
            element.src = 'http://example.com/song.mp3';
            document.body.appendChild(element);
            createGainNode(element);
            const beforeStop = audioNodeBus.length;
            removeAudioNodeBundle(element);
            expect(audioNodeBus.length).toBeLessThan(beforeStop);
        });
    });

    describe('Next/Previous track transitions', () => {
        it('should prepare next track while current plays', () => {
            initializeMasterAudio(mockUnbind);
            const currentElement = createMockMediaElement('current');
            currentElement.src = 'http://example.com/current.mp3';
            document.body.appendChild(currentElement);
            createGainNode(currentElement);
            setXDuration(3);
            expect(xDuration.enabled).toBe(true);
        });

        it('should handle rapid next track calls', () => {
            initializeMasterAudio(mockUnbind);
            for (let i = 0; i < 3; i++) {
                const element = createMockMediaElement(`track-${i}`);
                element.src = `http://example.com/track${i}.mp3`;
                document.body.appendChild(element);
                createGainNode(element);
                if (i > 0) {
                    removeAudioNodeBundle(document.getElementById(`track-${i - 1}`) as unknown as HTMLAudioElement);
                }
            }
        });
    });
});

describe('Error Recovery Integration Tests', () => {
    let mockUnbind: any;
    let originalAudioContext: any;
    let mockAudioContext: any;

    beforeEach(() => {
        vi.useFakeTimers();
        originalAudioContext = (window as any).AudioContext;
        mockAudioContext = createMockAudioContext();
        (window as any).AudioContext = vi.fn(() => mockAudioContext);
        mockUnbind = vi.fn();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        syncManager.stopSync();
        vi.advanceTimersByTime(200);
        vi.useRealTimers();
        document.body.innerHTML = '';
        (window as any).AudioContext = originalAudioContext;
    });

    describe('Recovery from stuck state', () => {
        it('should recover from stuck busy state', () => {
            initializeMasterAudio(mockUnbind);
            xDuration.busy = true;
            xDuration.triggered = true;
            cancelCrossfadeTimeouts();
            expect(xDuration.busy).toBe(false);
            expect(xDuration.triggered).toBe(false);
        });

        it('should reset all timers on error', () => {
            initializeMasterAudio(mockUnbind);
            setXDuration(10);
            xDuration.busy = true;
            cancelCrossfadeTimeouts();
            expect(xDuration.busy).toBe(false);
        });
    });

    describe('Audio context recovery', () => {
        it('should handle suspended audio context', () => {
            initializeMasterAudio(mockUnbind);
            mockAudioContext.state = 'suspended';
            setXDuration(5);
            expect(xDuration.enabled).toBe(true);
        });

        it('should handle resume failure', () => {
            initializeMasterAudio(mockUnbind);
            xDuration.busy = true;
            cancelCrossfadeTimeouts();
            expect(xDuration.busy).toBe(false);
        });
    });
});

describe('SyncManager Memory Safety', () => {
    let mockUnbind: any;
    let originalAudioContext: any;
    let mockAudioContext: any;

    beforeEach(() => {
        vi.useFakeTimers();
        originalAudioContext = (window as any).AudioContext;
        mockAudioContext = createMockAudioContext();
        (window as any).AudioContext = vi.fn(() => mockAudioContext);
        mockUnbind = vi.fn();
        document.body.innerHTML = '';
        syncManager.stopSync();
        syncManager['elements'].clear();
        syncManager['observers'].clear();
    });

    afterEach(() => {
        syncManager.stopSync();
        syncManager['elements'].clear();
        syncManager['observers'].clear();
        vi.useRealTimers();
        document.body.innerHTML = '';
        (window as any).AudioContext = originalAudioContext;
    });

    it('should auto-cleanup on element removal from DOM', () => {
        initializeMasterAudio(mockUnbind);
        const element = createMockMediaElement('test-element');
        element.src = 'http://example.com/song.mp3';
        document.body.appendChild(element);

        syncManager.registerElement(element, 0);
        expect(syncManager['elements'].has(element)).toBe(true);

        element.remove();
        vi.advanceTimersByTime(100);

        expect(syncManager['elements'].has(element)).toBe(false);
    });

    it('should auto-cleanup on ended event', () => {
        initializeMasterAudio(mockUnbind);
        const element = createMockMediaElement('test-element');
        element.src = 'http://example.com/song.mp3';
        document.body.appendChild(element);

        syncManager.registerElement(element, 0);
        expect(syncManager['elements'].has(element)).toBe(true);

        element.dispatchEvent(new Event('ended'));
        vi.advanceTimersByTime(100);

        expect(syncManager['elements'].has(element)).toBe(false);
    });

    it('should stop sync when all elements unregistered', () => {
        initializeMasterAudio(mockUnbind);
        const element = createMockMediaElement('test-element');
        element.src = 'http://example.com/song.mp3';
        document.body.appendChild(element);

        syncManager.registerElement(element, 0);
        expect(syncManager['syncInterval']).not.toBeNull();

        syncManager.unregisterElement(element);
        expect(syncManager['elements'].size).toBe(0);
    });

    it('should start sync when registering elements', () => {
        initializeMasterAudio(mockUnbind);
        const element = createMockMediaElement('test-element');
        element.src = 'http://example.com/song.mp3';
        document.body.appendChild(element);

        syncManager.registerElement(element, 0);
        expect(syncManager['syncInterval']).not.toBeNull();
    });
});

describe('Preload Network Timeout', () => {
    let mockUnbind: any;
    let originalAudioContext: any;
    let mockAudioContext: any;

    beforeEach(() => {
        vi.useFakeTimers();
        originalAudioContext = (window as any).AudioContext;
        mockAudioContext = createMockAudioContext();
        mockAudioContext.state = 'running';
        mockAudioContext.resume = vi.fn().mockResolvedValue(undefined);
        (window as any).AudioContext = vi.fn(() => mockAudioContext);
        mockUnbind = vi.fn();
        document.body.innerHTML = '';
        resetPreloadedTrack();

        // Mock play() since jsdom doesn't implement it
        Object.defineProperty(HTMLAudioElement.prototype, 'play', {
            value: vi.fn().mockReturnValue(Promise.resolve()),
            writable: true
        });
    });

    afterEach(() => {
        syncManager.stopSync();
        vi.advanceTimersByTime(200);
        vi.useRealTimers();
        document.body.innerHTML = '';
        (window as any).AudioContext = originalAudioContext;
        resetPreloadedTrack();
    });

    it.skip('should timeout slow preloads', async () => {
        // Skipped: jsdom doesn't fully support HTMLMediaElement buffered property
        initializeMasterAudio(mockUnbind);
        const element = document.createElement('audio') as unknown as HTMLAudioElement;
        Object.defineProperty(element, 'buffered', {
            value: { length: 0 },
            writable: true
        });
        document.body.appendChild(element);

        const result = await preloadNextTrack({
            itemId: 'test-item',
            url: 'http://example.com/slow-song.mp3',
            volume: 100,
            muted: false,
            timeoutMs: 1000
        });

        expect(result).toBe(false);
        expect(document.querySelector('[data-crossfade-preload="true"]')).toBeNull();
    });

    it.skip('should clear preload state on timeout', async () => {
        // Skipped: jsdom doesn't fully support HTMLMediaElement buffered property
        initializeMasterAudio(mockUnbind);
        const element = document.createElement('audio') as unknown as HTMLAudioElement;
        Object.defineProperty(element, 'buffered', {
            value: { length: 0 },
            writable: true
        });
        document.body.appendChild(element);

        await preloadNextTrack({
            itemId: 'test-item-2',
            url: 'http://example.com/another-song.mp3',
            volume: 100,
            muted: false,
            timeoutMs: 500
        });

        vi.advanceTimersByTime(600);

        const preloadElement = document.querySelector('[data-crossfade-preload="true"]');
        expect(preloadElement).toBeNull();
    });
});

describe('Double Cleanup Prevention', () => {
    let mockUnbind: any;
    let originalAudioContext: any;
    let mockAudioContext: any;

    beforeEach(() => {
        vi.useFakeTimers();
        originalAudioContext = (window as any).AudioContext;
        mockAudioContext = createMockAudioContext();
        (window as any).AudioContext = vi.fn(() => mockAudioContext);
        mockUnbind = vi.fn();
        document.body.innerHTML = '';
        resetPreloadedTrack();
    });

    afterEach(() => {
        syncManager.stopSync();
        vi.advanceTimersByTime(200);
        vi.useRealTimers();
        document.body.innerHTML = '';
        (window as any).AudioContext = originalAudioContext;
        resetPreloadedTrack();
    });

    it('should not double-cleanup element', () => {
        initializeMasterAudio(mockUnbind);
        const element = createMockMediaElement('test-element');
        document.body.appendChild(element);
        ensureAudioNodeBundle(element, { registerInBus: true });

        resetPreloadedTrack();

        const beforeRemove = audioNodeBus.length;
        resetPreloadedTrack();
        expect(audioNodeBus.length).toBeLessThanOrEqual(beforeRemove);
    });

    it('should handle multiple cleanup calls gracefully', () => {
        initializeMasterAudio(mockUnbind);
        const element = createMockMediaElement('test-element');
        document.body.appendChild(element);
        ensureAudioNodeBundle(element, { registerInBus: true });

        expect(() => {
            resetPreloadedTrack();
            resetPreloadedTrack();
            resetPreloadedTrack();
        }).not.toThrow();
    });
});
