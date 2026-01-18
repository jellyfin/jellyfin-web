import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    const audioParam = {
        value: 1,
        cancelScheduledValues: vi.fn(),
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
    };

    const masterAudioOutput = {
        audioContext: {
            currentTime: 0,
            state: 'running',
            resume: vi.fn(() => Promise.resolve())
        },
        mixerNode: {}
    };

    return {
        audioParam,
        masterAudioOutput,
        playWithPromise: vi.fn(() => Promise.resolve()),
        ensureAudioNodeBundle: vi.fn(),
        getAudioNodeBundle: vi.fn(),
        removeAudioNodeBundle: vi.fn()
    };
});

vi.mock('../htmlMediaHelper', () => ({
    playWithPromise: mocks.playWithPromise
}));

vi.mock('./master.logic', () => ({
    masterAudioOutput: mocks.masterAudioOutput,
    ensureAudioNodeBundle: mocks.ensureAudioNodeBundle,
    getAudioNodeBundle: mocks.getAudioNodeBundle,
    removeAudioNodeBundle: mocks.removeAudioNodeBundle
}));

import {
    consumePreloadedTrack,
    preloadNextTrack,
    resetPreloadedTrack,
    startCrossfade
} from './crossfadeController';
import { getAudioNodeBundle } from './master.logic';

function getPreloadedElement() {
    return document.querySelector('audio[data-crossfade-preload="true"]') as HTMLAudioElement | null;
}

describe('crossfadeController', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
        vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
        resetPreloadedTrack();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns false when audio engine is not initialized', async () => {
        mocks.masterAudioOutput.audioContext = undefined as any;

        const result = await preloadNextTrack({
            itemId: '1',
            url: 'https://example.com/test.mp3',
            volume: 1,
            muted: false,
            timeoutMs: 1000
        });

        expect(result).toBe(false);
        mocks.masterAudioOutput.audioContext = {
            currentTime: 0,
            state: 'running',
            resume: vi.fn(() => Promise.resolve())
        };
    });

    it('returns false when URL is missing', async () => {
        const result = await preloadNextTrack({
            itemId: '1',
            url: '',
            volume: 1,
            muted: false,
            timeoutMs: 1000
        });

        expect(result).toBe(false);
    });

    it('preloads and consumes a track when ready', async () => {
        mocks.ensureAudioNodeBundle.mockReturnValue({ gainNode: { gain: mocks.audioParam } });

        // Mock play() since jsdom doesn't implement it
        Object.defineProperty(HTMLAudioElement.prototype, 'play', { value: vi.fn().mockReturnValue(Promise.resolve()), writable: true });

        const preloadPromise = preloadNextTrack({
            itemId: '1',
            url: 'https://example.com/test.mp3',
            volume: 1,
            muted: false,
            timeoutMs: 1000
        });

        const element = getPreloadedElement();
        expect(element).not.toBeNull();
        element?.dispatchEvent(new Event('canplay'));

        const ready = await preloadPromise;
        expect(ready).toBe(true);

        const consumed = consumePreloadedTrack({ itemId: '1', url: 'https://example.com/test.mp3' });
        expect(consumed).toBe(element);
        expect(consumePreloadedTrack({ itemId: '1', url: 'https://example.com/test.mp3' })).toBeNull();
    });

    it('starts a crossfade and schedules gain ramps', async () => {
        const fromElement = document.createElement('audio');
        // Ensure AudioContext is mocked as running
        const ctx = mocks.masterAudioOutput.audioContext as any;
        if (ctx) {
            ctx.state = 'running';
            ctx.resume.mockResolvedValue(undefined);
        }

        // Ensure fromElement is in the elementNodeMap with a mock bundle
        mocks.getAudioNodeBundle.mockReturnValue({
            sourceNode: {} as any,
            normalizationGainNode: { gain: mocks.audioParam } as any,
            crossfadeGainNode: { gain: mocks.audioParam } as any,
            busRegistered: true
        });

        // Preload a track first
        mocks.ensureAudioNodeBundle.mockReturnValue({ gainNode: { gain: mocks.audioParam }, crossfadeGainNode: { gain: mocks.audioParam } });
        
        // Mock play() since jsdom doesn't implement it
        const mockPlay = vi.fn().mockReturnValue(Promise.resolve());
        Object.defineProperty(HTMLAudioElement.prototype, 'play', { value: mockPlay, writable: true });
        
        const preloadPromise = preloadNextTrack({
            itemId: '1',
            url: 'https://example.com/test.mp3',
            volume: 1,
            muted: false,
            timeoutMs: 1000
        });
        const element = getPreloadedElement();
        expect(element).not.toBeNull();
        if (element) Object.defineProperty(element, 'paused', { value: false, writable: true });
        element?.dispatchEvent(new Event('canplay'));
        await preloadPromise;

        const started = await startCrossfade({ fromElement, durationSeconds: 1.5 });

        expect(started).toBe(true);
        expect(mocks.audioParam.cancelScheduledValues).toHaveBeenCalled();
        expect(mocks.audioParam.linearRampToValueAtTime).toHaveBeenCalledWith(0.001, expect.any(Number));
        expect(mocks.audioParam.linearRampToValueAtTime).toHaveBeenCalledWith(1, expect.any(Number));

        fromElement.dispatchEvent(new Event('ended'));
        expect(mocks.removeAudioNodeBundle).toHaveBeenCalledWith(fromElement);
    });
});
