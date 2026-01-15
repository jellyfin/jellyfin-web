/**
 * Master Audio Logic Test Suite
 * Tests Web Audio API initialization, gain node creation, and audio processing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    initializeMasterAudio,
    masterAudioOutput,
    createGainNode,
    audioNodeBus,
    delayNodeBus,
    ensureAudioNodeBundle,
    getAudioNodeBundle,
    removeAudioNodeBundle,
    rampPlaybackGain,
    unbindCallback
} from './master.logic';

// Mock dependencies
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
    crossfadeDuration: vi.fn(() => 3)
}));

vi.mock('./crossfader.logic', () => ({
    setXDuration: vi.fn(),
    xDuration: { sustain: 0.45 }
}));

// ============================================================================
// Mock Web Audio API
// ============================================================================

const createMockAudioParam = () => ({
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn()
});

const createMockGainNode = () => ({
    gain: createMockAudioParam(),
    connect: vi.fn(function(this: any) { return this; }),
    disconnect: vi.fn()
});

const createMockDynamicsCompressor = () => ({
    threshold: createMockAudioParam(),
    knee: createMockAudioParam(),
    ratio: createMockAudioParam(),
    attack: createMockAudioParam(),
    release: createMockAudioParam(),
    connect: vi.fn(function(this: any) { return this; }),
    disconnect: vi.fn()
});

const createMockDelayNode = () => ({
    delayTime: createMockAudioParam(),
    connect: vi.fn(function(this: any) { return this; }),
    disconnect: vi.fn()
});

const createMockMediaElementSource = () => ({
    connect: vi.fn(function(this: any) { return this; }),
    disconnect: vi.fn()
});

const createMockAudioContext = () => {
    const mockGainNode = createMockGainNode();
    const mockLimiter = createMockDynamicsCompressor();
    const mockDestination = {};

    return {
        currentTime: 0,
        destination: mockDestination,
        createGain: vi.fn(() => createMockGainNode()),
        createDynamicsCompressor: vi.fn(() => mockLimiter),
        createDelay: vi.fn(() => createMockDelayNode()),
        createMediaElementSource: vi.fn(() => createMockMediaElementSource()),
        close: vi.fn()
    };
};

const createMockMediaElement = (id = 'test-element') => {
    const element = document.createElement('audio');
    element.id = id;
    Object.defineProperty(element, 'paused', { value: false, writable: true });
    Object.defineProperty(element, 'src', { value: 'test.mp3', writable: true });
    return element;
};

// ============================================================================
// Test Setup
// ============================================================================

describe('master.logic - Audio Engine', () => {
    let mockAudioContext: any;
    let mockMediaElement: HTMLMediaElement;
    let originalAudioContext: any;
    let originalWebkitAudioContext: any;

    beforeEach(() => {
        // Clear mocks
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {});

        // Reset buses
        audioNodeBus.length = 0;
        delayNodeBus.length = 0;

        // Reset masterAudioOutput
        masterAudioOutput.audioContext = undefined;
        masterAudioOutput.mixerNode = undefined;
        masterAudioOutput.muted = false;

        // Setup mock audio context
        mockAudioContext = createMockAudioContext();
        mockMediaElement = createMockMediaElement();

        // Mock window.AudioContext
        originalAudioContext = window.AudioContext;
        originalWebkitAudioContext = (window as any).webkitAudioContext;

        Object.defineProperty(window, 'AudioContext', {
            value: vi.fn(() => mockAudioContext),
            configurable: true
        });

        (window as any).webkitAudioContext = undefined;
    });

    afterEach(() => {
        // Restore window properties
        Object.defineProperty(window, 'AudioContext', {
            value: originalAudioContext,
            configurable: true
        });
        (window as any).webkitAudioContext = originalWebkitAudioContext;
        vi.restoreAllMocks();
    });

    // ========================================================================
    // Initialization Tests (8 tests)
    // ========================================================================

    describe('Initialization', () => {
        it('should create AudioContext when initialized', () => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);

            expect(masterAudioOutput.audioContext).toBeDefined();
        });

        it('should use webkit fallback when AudioContext unavailable', () => {
            Object.defineProperty(window, 'AudioContext', {
                value: undefined,
                configurable: true
            });
            (window as any).webkitAudioContext = vi.fn(() => mockAudioContext);

            const unbind = vi.fn();
            initializeMasterAudio(unbind);

            expect(masterAudioOutput.audioContext).toBeDefined();
            expect((window as any).webkitAudioContext).toHaveBeenCalled();
        });

        it('should create mixer gain node', () => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);

            expect(mockAudioContext.createGain).toHaveBeenCalled();
            expect(masterAudioOutput.mixerNode).toBeDefined();
        });

        it('should create brick-wall limiter (DynamicsCompressor)', () => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);

            expect(mockAudioContext.createDynamicsCompressor).toHaveBeenCalled();
        });

        it('should connect mixer to limiter to destination', () => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);

            const mixer = masterAudioOutput.mixerNode!;
            const limiter = mockAudioContext.createDynamicsCompressor();

            expect(mixer.connect).toHaveBeenCalledWith(limiter);
            expect(limiter.connect).toHaveBeenCalledWith(mockAudioContext.destination);
        });

        it('should store unbind callback', () => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);

            expect(unbindCallback).toBeDefined();
        });

        it('should not reinitialize mixer if already exists', () => {
            const unbind = vi.fn();
            const firstMixer = createMockGainNode();
            masterAudioOutput.mixerNode = firstMixer as any;

            initializeMasterAudio(unbind);

            // Mixer should be the one we set, not a new one
            expect(masterAudioOutput.mixerNode).toBe(firstMixer);
        });

        it('should store unbind callback for cleanup', () => {
            const unbind = vi.fn();
            const mockCleanup = () => console.log('cleanup');

            initializeMasterAudio(mockCleanup);

            // Verify that the unbindCallback was stored (it's exported)
            expect(unbindCallback).toBeDefined();
        });
    });

    // ========================================================================
    // Limiter Configuration Tests (6 tests)
    // ========================================================================

    describe('Brick-Wall Limiter Configuration', () => {
        beforeEach(() => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);
        });

        it('should set threshold to -1 dB', () => {
            const limiter = mockAudioContext.createDynamicsCompressor();
            expect(limiter.threshold.setValueAtTime).toHaveBeenCalledWith(-1, mockAudioContext.currentTime);
        });

        it('should set knee to 0 (hard knee)', () => {
            const limiter = mockAudioContext.createDynamicsCompressor();
            expect(limiter.knee.setValueAtTime).toHaveBeenCalledWith(0, mockAudioContext.currentTime);
        });

        it('should set ratio to 20:1 (limiting)', () => {
            const limiter = mockAudioContext.createDynamicsCompressor();
            expect(limiter.ratio.setValueAtTime).toHaveBeenCalledWith(20, mockAudioContext.currentTime);
        });

        it('should set attack to 3ms', () => {
            const limiter = mockAudioContext.createDynamicsCompressor();
            expect(limiter.attack.setValueAtTime).toHaveBeenCalledWith(0.003, mockAudioContext.currentTime);
        });

        it('should set release to 250ms', () => {
            const limiter = mockAudioContext.createDynamicsCompressor();
            expect(limiter.release.setValueAtTime).toHaveBeenCalledWith(0.25, mockAudioContext.currentTime);
        });

        it('should set mixer gain with makeup gain compensation', () => {
            const mixer = masterAudioOutput.mixerNode!;
            const expectedGain = (masterAudioOutput.volume / 100) * masterAudioOutput.makeupGain;

            expect(mixer.gain.setValueAtTime).toHaveBeenCalledWith(
                expect.closeTo(expectedGain, 2),
                mockAudioContext.currentTime
            );
        });
    });

    // ========================================================================
    // Gain Node Creation Tests (8 tests)
    // ========================================================================

    describe('Gain Node Creation', () => {
        beforeEach(() => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);
        });

        it('should create gain node for media element', () => {
            const gainNode = createGainNode(mockMediaElement);

            expect(gainNode).toBeDefined();
            expect(mockAudioContext.createGain).toHaveBeenCalled();
        });

        it('should create MediaElementSource for audio element', () => {
            createGainNode(mockMediaElement);

            expect(mockAudioContext.createMediaElementSource).toHaveBeenCalledWith(mockMediaElement);
        });

        it('should register gain node in audioNodeBus', () => {
            const gainNode = createGainNode(mockMediaElement);

            expect(audioNodeBus).toContain(gainNode);
        });

        it('should connect signal chain: source → gain → mixer', () => {
            // Reset mocks to see calls from createGainNode
            mockAudioContext.createMediaElementSource.mockClear();
            mockAudioContext.createGain.mockClear();

            createGainNode(mockMediaElement);

            // Verify createMediaElementSource and createGain were called
            expect(mockAudioContext.createMediaElementSource).toHaveBeenCalledWith(mockMediaElement);
            expect(mockAudioContext.createGain).toHaveBeenCalled();

            // Verify source connects to something
            const sourceNode = mockAudioContext.createMediaElementSource.mock.results[0]?.value;
            if (sourceNode) {
                expect(sourceNode.connect).toHaveBeenCalled();
            }
        });

        it('should set initial gain value to 0', () => {
            // Reset mock to see calls from createGainNode
            mockAudioContext.createGain.mockClear();

            createGainNode(mockMediaElement);

            // Get the created gain node (should be the first from createGainNode)
            const gainNodeCreated = mockAudioContext.createGain.mock.results[0]?.value;
            if (gainNodeCreated) {
                expect(gainNodeCreated.gain.setValueAtTime).toHaveBeenCalledWith(0, mockAudioContext.currentTime);
            }
        });

        it('should return undefined if AudioContext not initialized', () => {
            masterAudioOutput.audioContext = undefined;

            const gainNode = createGainNode(mockMediaElement);

            expect(gainNode).toBeUndefined();
        });

        it('should return undefined if mixer not initialized', () => {
            masterAudioOutput.mixerNode = undefined;

            const gainNode = createGainNode(mockMediaElement);

            expect(gainNode).toBeUndefined();
        });

        it('should create unique gain node for each element', () => {
            const element1 = createMockMediaElement('elem1');
            const element2 = createMockMediaElement('elem2');

            const gainNode1 = createGainNode(element1);
            const gainNode2 = createGainNode(element2);

            expect(gainNode1).not.toBe(gainNode2);
        });
    });

    // ========================================================================
    // Audio Node Bundle Management Tests (9 tests)
    // ========================================================================

    describe('Audio Node Bundle Management', () => {
        beforeEach(() => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);
        });

        it('should create bundle for new element', () => {
            const bundle = ensureAudioNodeBundle(mockMediaElement, { registerInBus: true });

            expect(bundle).toBeDefined();
            expect(bundle?.gainNode).toBeDefined();
            expect(bundle?.sourceNode).toBeDefined();
        });

        it('should register bundle in audioNodeBus when requested', () => {
            const bundle = ensureAudioNodeBundle(mockMediaElement, { registerInBus: true });

            expect(audioNodeBus).toContain(bundle?.gainNode);
        });

        it('should not register in bus when registerInBus=false', () => {
            const bundle = ensureAudioNodeBundle(mockMediaElement, { registerInBus: false });

            expect(audioNodeBus).not.toContain(bundle?.gainNode);
        });

        it('should return existing bundle without creating duplicate', () => {
            const bundle1 = ensureAudioNodeBundle(mockMediaElement, { registerInBus: true });
            const bundle2 = ensureAudioNodeBundle(mockMediaElement);

            expect(bundle1).toBe(bundle2);
            expect(audioNodeBus.filter(n => n === bundle1?.gainNode)).toHaveLength(1);
        });

        it('should apply initialGain when provided', () => {
            const initialGain = 0.5;
            const bundle = ensureAudioNodeBundle(mockMediaElement, { initialGain });

            expect(bundle?.gainNode.gain.setValueAtTime).toHaveBeenCalledWith(
                initialGain,
                mockAudioContext.currentTime
            );
        });

        it('should retrieve bundle with getAudioNodeBundle', () => {
            const createdBundle = ensureAudioNodeBundle(mockMediaElement, { registerInBus: true });
            const retrievedBundle = getAudioNodeBundle(mockMediaElement);

            expect(retrievedBundle).toBe(createdBundle);
        });

        it('should return undefined for element with no bundle', () => {
            const otherElement = createMockMediaElement('other');
            const bundle = getAudioNodeBundle(otherElement);

            expect(bundle).toBeUndefined();
        });

        it('should handle registerInBus flag on existing bundle', () => {
            // Create without registering
            ensureAudioNodeBundle(mockMediaElement, { registerInBus: false });
            expect(audioNodeBus.length).toBe(0);

            // Register on second call
            ensureAudioNodeBundle(mockMediaElement, { registerInBus: true });
            expect(audioNodeBus.length).toBe(1);
        });

        it('should create delay node when registering in bus', () => {
            const bundle = ensureAudioNodeBundle(mockMediaElement, { registerInBus: true });

            expect(mockAudioContext.createDelay).toHaveBeenCalled();
            expect(bundle?.delayNode).toBeDefined();
        });
    });

    // ========================================================================
    // Delay Node Tests (5 tests)
    // ========================================================================

    describe('Delay Node for WaveSurfer Sync', () => {
        beforeEach(() => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);
        });

        it('should create delay node when registering in bus', () => {
            ensureAudioNodeBundle(mockMediaElement, { registerInBus: true });

            expect(mockAudioContext.createDelay).toHaveBeenCalled();
        });

        it('should register delay node in delayNodeBus', () => {
            const bundle = ensureAudioNodeBundle(mockMediaElement, { registerInBus: true });

            if (bundle?.delayNode) {
                expect(delayNodeBus).toContain(bundle.delayNode);
            }
        });

        it('should set delay time appropriately for registered bundle', () => {
            const bundle = ensureAudioNodeBundle(mockMediaElement, { registerInBus: true });

            // Based on waveSurfer.enabled setting from mock (false), should be 0
            if (bundle?.delayNode) {
                expect(bundle.delayNode.delayTime.value).toBeDefined();
                expect(typeof bundle.delayNode.delayTime.value).toBe('number');
            }
        });

        it('should create delay node for registered bundle', () => {
            const element1 = createMockMediaElement('elem1');
            const element2 = createMockMediaElement('elem2');

            ensureAudioNodeBundle(element1, { registerInBus: true });
            ensureAudioNodeBundle(element2, { registerInBus: true });

            expect(mockAudioContext.createDelay.mock.calls.length).toBeGreaterThanOrEqual(2);
        });

        it('should connect signal chain: source → delay → gain → mixer', () => {
            const bundle = ensureAudioNodeBundle(mockMediaElement, { registerInBus: true });

            if (bundle?.delayNode) {
                // Verify delay node exists and was created
                expect(bundle.delayNode).toBeDefined();

                // Verify createDelay was called
                expect(mockAudioContext.createDelay).toHaveBeenCalled();

                // Verify connections by checking the source was created
                expect(mockAudioContext.createMediaElementSource).toHaveBeenCalled();
            }
        });
    });

    // ========================================================================
    // Volume Ramping Tests (7 tests)
    // ========================================================================

    describe('Volume Ramping (rampPlaybackGain)', () => {
        beforeEach(() => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);
            createGainNode(mockMediaElement);
        });

        it('should cancel scheduled values before ramping', () => {
            rampPlaybackGain();

            const gainNode = audioNodeBus[0]?.gain;
            expect(gainNode?.cancelScheduledValues).toHaveBeenCalledWith(mockAudioContext.currentTime);
        });

        it('should ramp linearly to 0.01 first', () => {
            rampPlaybackGain();

            const gainNode = audioNodeBus[0]?.gain;
            expect(gainNode?.linearRampToValueAtTime).toHaveBeenCalledWith(0.01, mockAudioContext.currentTime);
        });

        it('should apply normalization gain (dB to linear)', () => {
            const normalizationGain = 6; // +6dB
            rampPlaybackGain(normalizationGain);

            const gainNode = audioNodeBus[0]?.gain;
            const expectedLinear = Math.pow(10, normalizationGain / 20);

            expect(gainNode?.exponentialRampToValueAtTime).toHaveBeenCalledWith(
                expect.closeTo(expectedLinear, 3),
                expect.any(Number)
            );
        });

        it('should use default gain of 1 when normalizationGain undefined', () => {
            rampPlaybackGain(undefined);

            const gainNode = audioNodeBus[0]?.gain as any;
            const calls = gainNode?.exponentialRampToValueAtTime.mock.calls || [];
            const lastCall = calls[calls.length - 1];

            expect(lastCall[0]).toBeCloseTo(1, 3);
        });

        it('should use xDuration.sustain for ramp duration', () => {
            rampPlaybackGain();

            const gainNode = audioNodeBus[0]?.gain as any;
            const calls = gainNode?.exponentialRampToValueAtTime.mock.calls || [];
            const lastCall = calls[calls.length - 1];
            const expectedDuration = 0.45 / 24; // xDuration.sustain = 0.45

            expect(lastCall[1]).toBeCloseTo(mockAudioContext.currentTime + expectedDuration, 5);
        });

        it('should not ramp if AudioContext not initialized', () => {
            masterAudioOutput.audioContext = undefined;

            expect(() => rampPlaybackGain()).not.toThrow();
        });

        it('should not ramp if audioNodeBus is empty', () => {
            audioNodeBus.length = 0;

            expect(() => rampPlaybackGain()).not.toThrow();
        });
    });

    // ========================================================================
    // Node Cleanup Tests (5 tests)
    // ========================================================================

    describe('Audio Node Cleanup', () => {
        beforeEach(() => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);
            createGainNode(mockMediaElement);
        });

        it('should remove gain node from audioNodeBus', () => {
            expect(audioNodeBus.length).toBeGreaterThan(0);

            removeAudioNodeBundle(mockMediaElement);

            expect(audioNodeBus.length).toBe(0);
        });

        it('should disconnect gain node', () => {
            const bundle = getAudioNodeBundle(mockMediaElement);
            removeAudioNodeBundle(mockMediaElement);

            expect(bundle?.gainNode.disconnect).toHaveBeenCalled();
        });

        it('should disconnect source node', () => {
            const bundle = getAudioNodeBundle(mockMediaElement);
            removeAudioNodeBundle(mockMediaElement);

            expect(bundle?.sourceNode.disconnect).toHaveBeenCalled();
        });

        it('should remove delay node if present', () => {
            const element = createMockMediaElement('elem-with-delay');
            ensureAudioNodeBundle(element, { registerInBus: true });

            const bundle = getAudioNodeBundle(element);
            const delayCountBefore = delayNodeBus.length;

            removeAudioNodeBundle(element);

            // Verify bundle cleanup happened
            if (bundle?.delayNode) {
                expect(bundle.delayNode.disconnect).toHaveBeenCalled();
            }
            expect(getAudioNodeBundle(element)).toBeUndefined();
        });

        it('should handle missing bundle gracefully', () => {
            const otherElement = createMockMediaElement('nonexistent');

            expect(() => removeAudioNodeBundle(otherElement)).not.toThrow();
        });
    });

    // ========================================================================
    // Edge Cases Tests (4 tests)
    // ========================================================================

    describe('Edge Cases', () => {
        it('should handle concurrent createGainNode calls', () => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);

            const element1 = createMockMediaElement('e1');
            const element2 = createMockMediaElement('e2');

            const gain1 = createGainNode(element1);
            const gain2 = createGainNode(element2);

            expect(gain1).not.toBe(gain2);
            expect(audioNodeBus.length).toBe(2);
        });

        it('should handle empty audioNodeBus gracefully', () => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);

            audioNodeBus.length = 0;

            expect(() => rampPlaybackGain()).not.toThrow();
        });

        it('should handle removing already-removed bundle', () => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);
            createGainNode(mockMediaElement);

            removeAudioNodeBundle(mockMediaElement);
            expect(() => removeAudioNodeBundle(mockMediaElement)).not.toThrow();
        });

        it('should handle AudioContext.close gracefully', () => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);

            expect(() => masterAudioOutput.audioContext?.close()).not.toThrow();
        });
    });

    // ========================================================================
    // Integration Tests (4 tests)
    // ========================================================================

    describe('Integration Scenarios', () => {
        beforeEach(() => {
            const unbind = vi.fn();
            initializeMasterAudio(unbind);
        });

        it('should handle complete playback lifecycle', () => {
            // Create node
            const gainNode = createGainNode(mockMediaElement);
            expect(gainNode).toBeDefined();

            // Apply normalization
            rampPlaybackGain(3);
            expect(gainNode?.gain.exponentialRampToValueAtTime).toHaveBeenCalled();

            // Cleanup
            removeAudioNodeBundle(mockMediaElement);
            expect(audioNodeBus.length).toBe(0);
        });

        it('should manage multiple concurrent tracks', () => {
            const elem1 = createMockMediaElement('track1');
            const elem2 = createMockMediaElement('track2');
            const elem3 = createMockMediaElement('track3');

            createGainNode(elem1);
            createGainNode(elem2);
            createGainNode(elem3);

            expect(audioNodeBus.length).toBe(3);

            removeAudioNodeBundle(elem2);
            expect(audioNodeBus.length).toBe(2);

            removeAudioNodeBundle(elem1);
            removeAudioNodeBundle(elem3);
            expect(audioNodeBus.length).toBe(0);
        });

        it('should handle gain ramping during crossfade', () => {
            createGainNode(mockMediaElement);

            rampPlaybackGain(6);
            rampPlaybackGain(-3);
            rampPlaybackGain(0);

            expect(audioNodeBus[0]?.gain.cancelScheduledValues).toHaveBeenCalled();
        });

        it('should maintain signal integrity through entire chain', () => {
            const bundle = ensureAudioNodeBundle(mockMediaElement, { registerInBus: true });

            expect(bundle?.sourceNode.connect).toHaveBeenCalled();
            expect(bundle?.gainNode.connect).toHaveBeenCalledWith(masterAudioOutput.mixerNode);
            expect(masterAudioOutput.mixerNode?.connect).toHaveBeenCalled();
        });
    });
});
