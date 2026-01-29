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

function getPreloadedElement() {
    return document.querySelector(
        'audio[data-crossfade-preload="true"]'
    ) as HTMLAudioElement | null;
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

    it.skip('returns false when audio engine is not initialized', async () => {
        mocks.masterAudioOutput.audioContext = undefined as any;

        const result = await preloadNextTrack({
            itemId: '1',
            url: 'https://example.com/test.mp3',
            volume: 1,
            muted: false,
            timeoutMs: 1000,
            purpose: 'crossfade'
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
            timeoutMs: 1000,
            purpose: 'crossfade'
        });

        expect(result).toBe(false);
    });

    it('preloads and consumes a track when ready', async () => {
        mocks.ensureAudioNodeBundle.mockReturnValue({ gainNode: { gain: mocks.audioParam } });

        Object.defineProperty(HTMLAudioElement.prototype, 'play', {
            value: vi.fn().mockReturnValue(Promise.resolve()),
            writable: true
        });

        const preloadPromise = preloadNextTrack({
            itemId: '1',
            url: 'https://example.com/test.mp3',
            volume: 1,
            muted: false,
            timeoutMs: 1000,
            purpose: 'crossfade'
        });

        const element = getPreloadedElement();
        expect(element).not.toBeNull();
        element?.dispatchEvent(new Event('canplay'));

        const ready = await preloadPromise;
        expect(ready).toBe(true);

        const consumed = consumePreloadedTrack({
            itemId: '1',
            url: 'https://example.com/test.mp3'
        });
        expect(consumed).toBe(element);
        expect(
            consumePreloadedTrack({ itemId: '1', url: 'https://example.com/test.mp3' })
        ).toBeNull();
    });

    it.skip('starts a crossfade and schedules gain ramps', async () => {
        const fromElement = document.createElement('audio');
        const ctx = mocks.masterAudioOutput.audioContext as any;
        if (ctx) {
            ctx.state = 'running';
            ctx.resume.mockResolvedValue(undefined);
        }

        mocks.getAudioNodeBundle.mockReturnValue({
            sourceNode: {} as any,
            normalizationGainNode: { gain: mocks.audioParam } as any,
            crossfadeGainNode: { gain: mocks.audioParam } as any,
            busRegistered: true
        });

        mocks.ensureAudioNodeBundle.mockReturnValue({
            gainNode: { gain: mocks.audioParam },
            crossfadeGainNode: { gain: mocks.audioParam }
        });

        const mockPlay = vi.fn().mockReturnValue(Promise.resolve());
        Object.defineProperty(HTMLAudioElement.prototype, 'play', {
            value: mockPlay,
            writable: true
        });

        const preloadPromise = preloadNextTrack({
            itemId: '1',
            url: 'https://example.com/test.mp3',
            volume: 1,
            muted: false,
            timeoutMs: 1000,
            purpose: 'crossfade'
        });
        const element = getPreloadedElement();
        expect(element).not.toBeNull();
        if (element) Object.defineProperty(element, 'paused', { value: false, writable: true });
        element?.dispatchEvent(new Event('canplay'));
        await preloadPromise;

        const started = await startCrossfade({ fromElement, durationSeconds: 1.5 });

        expect(started).toBe(true);
        expect(mocks.audioParam.cancelScheduledValues).toHaveBeenCalled();
        expect(mocks.audioParam.linearRampToValueAtTime).toHaveBeenCalledWith(
            0.001,
            expect.any(Number)
        );
        expect(mocks.audioParam.linearRampToValueAtTime).toHaveBeenCalledWith(
            1,
            expect.any(Number)
        );

        fromElement.dispatchEvent(new Event('ended'));
        expect(mocks.removeAudioNodeBundle).toHaveBeenCalledWith(fromElement);
    });

    describe('preload strategy', () => {
        beforeEach(() => {
            mocks.ensureAudioNodeBundle.mockReturnValue({
                gainNode: { gain: mocks.audioParam },
                crossfadeGainNode: { gain: mocks.audioParam }
            });
        });

        it('uses preload=metadata for streaming strategy', async () => {
            const preloadPromise = preloadNextTrack({
                itemId: 'stream-test',
                url: 'https://example.com/test.mp3',
                volume: 1,
                muted: false,
                timeoutMs: 10000,
                purpose: 'crossfade',
                strategy: 'streaming'
            });

            const element = getPreloadedElement();
            expect(element).not.toBeNull();
            expect(element?.preload).toBe('metadata');

            element?.dispatchEvent(new Event('canplay'));
            await preloadPromise;
        });

        it('uses preload=auto for full strategy', async () => {
            Object.defineProperty(HTMLAudioElement.prototype, 'play', {
                value: vi.fn().mockReturnValue(Promise.resolve()),
                writable: true
            });

            const preloadPromise = preloadNextTrack({
                itemId: 'full-test',
                url: 'https://example.com/test.mp3',
                volume: 1,
                muted: false,
                timeoutMs: 10000,
                purpose: 'crossfade',
                strategy: 'full'
            });

            const element = getPreloadedElement();
            expect(element).not.toBeNull();
            expect(element?.preload).toBe('auto');

            element?.dispatchEvent(new Event('canplay'));
            await preloadPromise;
        });

        it('sets data-preload-strategy attribute correctly', async () => {
            const preloadPromise = preloadNextTrack({
                itemId: 'attr-test',
                url: 'https://example.com/test.mp3',
                volume: 1,
                muted: false,
                timeoutMs: 1000,
                purpose: 'crossfade',
                strategy: 'streaming'
            });

            const element = getPreloadedElement();
            expect(element?.getAttribute('data-preload-strategy')).toBe('streaming');

            element?.dispatchEvent(new Event('canplay'));
            await preloadPromise;
        });

        it('defaults to full strategy when strategy not specified', async () => {
            Object.defineProperty(HTMLAudioElement.prototype, 'play', {
                value: vi.fn().mockReturnValue(Promise.resolve()),
                writable: true
            });

            const preloadPromise = preloadNextTrack({
                itemId: 'default-test',
                url: 'https://example.com/test.mp3',
                volume: 1,
                muted: false,
                timeoutMs: 1000,
                purpose: 'crossfade'
            });

            const element = getPreloadedElement();
            expect(element).not.toBeNull();
            expect(element?.preload).toBe('auto');
            expect(element?.getAttribute('data-preload-strategy')).toBe('full');

            element?.dispatchEvent(new Event('canplay'));
            await preloadPromise;
        });

        it('does not call play() for streaming strategy (no forced buffering)', async () => {
            let playCalled = false;
            Object.defineProperty(HTMLAudioElement.prototype, 'play', {
                value: vi.fn().mockImplementation(() => {
                    playCalled = true;
                    return Promise.resolve();
                }),
                writable: true
            });

            const preloadPromise = preloadNextTrack({
                itemId: 'no-play-test',
                url: 'https://example.com/test.mp3',
                volume: 1,
                muted: false,
                timeoutMs: 1000,
                purpose: 'crossfade',
                strategy: 'streaming'
            });

            const element = getPreloadedElement();
            element?.dispatchEvent(new Event('canplay'));
            await preloadPromise;

            expect(playCalled).toBe(false);
        });

        it('calls play() for full strategy to force buffering', async () => {
            let playCalled = false;
            Object.defineProperty(HTMLAudioElement.prototype, 'play', {
                value: vi.fn().mockImplementation(() => {
                    playCalled = true;
                    return Promise.resolve();
                }),
                writable: true
            });

            const preloadPromise = preloadNextTrack({
                itemId: 'play-test',
                url: 'https://example.com/test.mp3',
                volume: 1,
                muted: false,
                timeoutMs: 1000,
                purpose: 'crossfade',
                strategy: 'full'
            });

            const element = getPreloadedElement();
            element?.dispatchEvent(new Event('canplay'));
            await preloadPromise;

            expect(playCalled).toBe(true);
        });

        it('reuses existing preloaded track with same item and strategy', async () => {
            Object.defineProperty(HTMLAudioElement.prototype, 'play', {
                value: vi.fn().mockReturnValue(Promise.resolve()),
                writable: true
            });

            const preloadPromise1 = preloadNextTrack({
                itemId: 'reuse-test',
                url: 'https://example.com/test.mp3',
                volume: 1,
                muted: false,
                timeoutMs: 1000,
                purpose: 'crossfade',
                strategy: 'full'
            });

            const element1 = getPreloadedElement();
            element1?.dispatchEvent(new Event('canplay'));
            await preloadPromise1;

            const elementBefore = getPreloadedElement();

            const preloadPromise2 = preloadNextTrack({
                itemId: 'reuse-test',
                url: 'https://example.com/test.mp3',
                volume: 1,
                muted: false,
                timeoutMs: 1000,
                purpose: 'crossfade',
                strategy: 'full'
            });

            const elementAfter = getPreloadedElement();
            expect(elementBefore).toBe(elementAfter);

            await preloadPromise2;
        });

        it.skip('clears preloaded element when strategy changes', async () => {
            mocks.ensureAudioNodeBundle.mockReturnValue({
                gainNode: { gain: mocks.audioParam },
                crossfadeGainNode: { gain: mocks.audioParam }
            });

            const preloadPromise1 = preloadNextTrack({
                itemId: 'strategy-change',
                url: 'https://example.com/test.mp3',
                volume: 1,
                muted: false,
                timeoutMs: 1000,
                purpose: 'crossfade',
                strategy: 'full'
            });

            const element1 = getPreloadedElement();
            const preload1Url = element1?.src;
            element1?.dispatchEvent(new Event('canplay'));
            await preloadPromise1;

            const preloadPromise2 = preloadNextTrack({
                itemId: 'strategy-change',
                url: 'https://example.com/test.mp3',
                volume: 1,
                muted: false,
                timeoutMs: 1000,
                purpose: 'crossfade',
                strategy: 'streaming'
            });

            await preloadPromise2;

            const element2 = getPreloadedElement();
            expect(preload1Url).toBeTruthy();
            expect(element2?.getAttribute('data-preload-strategy')).toBe('streaming');
            expect(element2?.preload).toBe('metadata');
        });
    });
});
