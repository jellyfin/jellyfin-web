import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    const audioParam = {
        value: 1,
        cancelScheduledValues: vi.fn(),
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn()
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
        const gainNode = { gain: mocks.audioParam };
        mocks.ensureAudioNodeBundle.mockReturnValue({ gainNode });
        mocks.getAudioNodeBundle.mockReturnValue({ gainNode: { gain: mocks.audioParam } });

        const preloadPromise = preloadNextTrack({
            itemId: '1',
            url: 'https://example.com/test.mp3',
            volume: 1,
            muted: false,
            timeoutMs: 1000
        });

        const preloaded = getPreloadedElement();
        expect(preloaded).not.toBeNull();
        if (preloaded) {
            Object.defineProperty(preloaded, 'paused', { value: false, configurable: true });
            preloaded.dispatchEvent(new Event('canplay'));
        }

        await preloadPromise;

        const fromElement = document.createElement('audio');
        const started = await startCrossfade({ fromElement, durationSeconds: 1.5 });

        expect(started).toBe(true);
        expect(mocks.audioParam.cancelScheduledValues).toHaveBeenCalled();
        expect(mocks.audioParam.linearRampToValueAtTime).toHaveBeenCalledWith(0.001, 1.5);

        fromElement.dispatchEvent(new Event('ended'));
        expect(mocks.removeAudioNodeBundle).toHaveBeenCalledWith(fromElement);
    });
});
