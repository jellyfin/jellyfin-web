/* eslint-disable sonarjs/no-identical-functions */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getState: vi.fn().mockReturnValue({ items: [], currentIndex: 0 }),
    isCrossfadeEnabled: vi.fn().mockReturnValue(true),
    isVisualizerEnabled: vi.fn().mockReturnValue(true),
    preloadNextTrack: vi.fn().mockResolvedValue(true),
    imagePreloader: {
        preloadImage: vi.fn()
    },
    extractPeaksForAnalysis: vi.fn().mockResolvedValue(null)
}));

vi.mock('../../store/queueStore', () => ({
    useQueueStore: {
        getState: mocks.getState
    }
}));

vi.mock('../../store/preferencesStore', () => ({
    isCrossfadeEnabled: mocks.isCrossfadeEnabled,
    isVisualizerEnabled: mocks.isVisualizerEnabled,
    usePreferencesStore: {
        getState: vi.fn().mockReturnValue({
            crossfade: { crossfadeDuration: 5 }
        })
    }
}));

vi.mock('./crossfadeController', () => ({
    preloadNextTrack: mocks.preloadNextTrack,
    resetPreloadedTrack: vi.fn()
}));

vi.mock('../../utils/imagePreloader', () => ({
    imagePreloader: mocks.imagePreloader
}));

vi.mock('../../utils/peakAnalyzer', () => ({
    extractPeaksForAnalysis: mocks.extractPeaksForAnalysis
}));

describe('crossfadePreloadManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.preloadNextTrack.mockResolvedValue(true);
        mocks.getState.mockReturnValue({ items: [], currentIndex: 0 });
        mocks.isCrossfadeEnabled.mockReturnValue(true);
        mocks.isVisualizerEnabled.mockReturnValue(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('handleManualSkip with strategy selection', () => {
        it('uses full strategy for queue items', async () => {
            const { handleManualSkip, resetPreloadState } = await import(
                './crossfadePreloadManager'
            );

            mocks.getState.mockReturnValue({
                items: [{ item: { id: 'queue-item' } }, { item: { id: 'other-item' } }]
            });

            resetPreloadState();

            const trackInfo = {
                itemId: 'queue-item',
                url: 'https://example.com/test.mp3',
                volume: 1,
                muted: false
            };

            await handleManualSkip(trackInfo);

            expect(mocks.preloadNextTrack).toHaveBeenCalledWith(
                expect.objectContaining({
                    itemId: 'queue-item',
                    strategy: 'full'
                })
            );
        });

        it('uses streaming strategy for non-queue items', async () => {
            const { handleManualSkip, resetPreloadState } = await import(
                './crossfadePreloadManager'
            );

            mocks.getState.mockReturnValue({
                items: [{ item: { id: 'queue-item' } }]
            });

            resetPreloadState();

            const trackInfo = {
                itemId: 'external-item',
                url: 'https://example.com/external.mp3',
                volume: 1,
                muted: false
            };

            await handleManualSkip(trackInfo);

            expect(mocks.preloadNextTrack).toHaveBeenCalledWith(
                expect.objectContaining({
                    itemId: 'external-item',
                    strategy: 'streaming'
                })
            );
        });

        it('preloads all image types for queue items', async () => {
            const { handleManualSkip, resetPreloadState } = await import(
                './crossfadePreloadManager'
            );

            mocks.getState.mockReturnValue({
                items: [{ item: { id: 'queue-item' } }]
            });

            resetPreloadState();

            const trackInfo = {
                itemId: 'queue-item',
                url: 'https://example.com/test.mp3',
                imageUrl: 'https://example.com/art.jpg',
                backdropUrl: 'https://example.com/backdrop.jpg',
                artistLogoUrl: 'https://example.com/logo.png',
                discImageUrl: 'https://example.com/disc.png',
                volume: 1,
                muted: false
            };

            await handleManualSkip(trackInfo);

            expect(mocks.imagePreloader.preloadImage).toHaveBeenCalledWith(
                'https://example.com/art.jpg'
            );
            expect(mocks.imagePreloader.preloadImage).toHaveBeenCalledWith(
                'https://example.com/backdrop.jpg'
            );
            expect(mocks.imagePreloader.preloadImage).toHaveBeenCalledWith(
                'https://example.com/logo.png'
            );
            expect(mocks.imagePreloader.preloadImage).toHaveBeenCalledWith(
                'https://example.com/disc.png'
            );
        });

        it('skips all image preloading for non-queue items', async () => {
            const { handleManualSkip, resetPreloadState } = await import(
                './crossfadePreloadManager'
            );

            mocks.getState.mockReturnValue({
                items: [{ item: { id: 'queue-item' } }]
            });

            resetPreloadState();

            const trackInfo = {
                itemId: 'external-item',
                url: 'https://example.com/external.mp3',
                imageUrl: 'https://example.com/art.jpg',
                backdropUrl: 'https://example.com/backdrop.jpg',
                volume: 1,
                muted: false
            };

            await handleManualSkip(trackInfo);

            expect(mocks.imagePreloader.preloadImage).not.toHaveBeenCalled();
        });

        it('returns false when preload fails', async () => {
            mocks.preloadNextTrack.mockResolvedValue(false);

            const { handleManualSkip, resetPreloadState } = await import(
                './crossfadePreloadManager'
            );

            mocks.getState.mockReturnValue({
                items: [{ item: { id: 'queue-item' } }]
            });

            resetPreloadState();

            const trackInfo = {
                itemId: 'queue-item',
                url: 'https://example.com/test.mp3',
                volume: 1,
                muted: false
            };

            const result = await handleManualSkip(trackInfo);
            expect(result).toBe(false);
            expect(mocks.imagePreloader.preloadImage).not.toHaveBeenCalled();
        });
    });

    describe('handleTrackStart with peak extraction', () => {
        it('extracts peaks for next track when in queue', async () => {
            const { handleTrackStart, resetPreloadState } = await import(
                './crossfadePreloadManager'
            );

            mocks.getState.mockReturnValue({
                items: [{ item: { id: 'current' } }, { item: { id: 'next-in-queue' } }],
                currentIndex: 0
            });

            resetPreloadState();

            const currentTrack = {
                itemId: 'current',
                url: 'https://example.com/current.mp3',
                volume: 1,
                muted: false
            };

            const getNextTrack = () => ({
                itemId: 'next-in-queue',
                url: 'https://example.com/next.mp3',
                volume: 1,
                muted: false
            });

            await handleTrackStart(currentTrack, getNextTrack);

            expect(mocks.extractPeaksForAnalysis).toHaveBeenCalledWith(
                'next-in-queue',
                'https://example.com/next.mp3'
            );
        });

        it('skips peak extraction for next track not in queue', async () => {
            const { handleTrackStart, resetPreloadState } = await import(
                './crossfadePreloadManager'
            );

            mocks.getState.mockReturnValue({
                items: [{ item: { id: 'current' } }],
                currentIndex: 0
            });

            resetPreloadState();

            const currentTrack = {
                itemId: 'current',
                url: 'https://example.com/current.mp3',
                volume: 1,
                muted: false
            };

            const getNextTrack = () => ({
                itemId: 'external-track',
                url: 'https://example.com/external.mp3',
                volume: 1,
                muted: false
            });

            await handleTrackStart(currentTrack, getNextTrack);

            expect(mocks.extractPeaksForAnalysis).not.toHaveBeenCalled();
        });

        it('does not extract peaks when visualizer is disabled', async () => {
            mocks.isVisualizerEnabled.mockReturnValue(false);

            const { handleTrackStart, resetPreloadState } = await import(
                './crossfadePreloadManager'
            );

            mocks.getState.mockReturnValue({
                items: [{ item: { id: 'current' } }, { item: { id: 'next-in-queue' } }],
                currentIndex: 0
            });

            resetPreloadState();

            const currentTrack = {
                itemId: 'current',
                url: 'https://example.com/current.mp3',
                volume: 1,
                muted: false
            };

            const getNextTrack = () => ({
                itemId: 'next-in-queue',
                url: 'https://example.com/next.mp3',
                volume: 1,
                muted: false
            });

            await handleTrackStart(currentTrack, getNextTrack);

            expect(mocks.extractPeaksForAnalysis).not.toHaveBeenCalled();
        });

        it('does not extract peaks when crossfade is disabled and visualizer is disabled', async () => {
            mocks.isCrossfadeEnabled.mockReturnValue(false);
            mocks.isVisualizerEnabled.mockReturnValue(false);

            const { handleTrackStart, resetPreloadState } = await import(
                './crossfadePreloadManager'
            );

            mocks.getState.mockReturnValue({
                items: [{ item: { id: 'current' } }, { item: { id: 'next-in-queue' } }],
                currentIndex: 0
            });

            resetPreloadState();

            const currentTrack = {
                itemId: 'current',
                url: 'https://example.com/current.mp3',
                volume: 1,
                muted: false
            };

            const getNextTrack = () => ({
                itemId: 'next-in-queue',
                url: 'https://example.com/next.mp3',
                volume: 1,
                muted: false
            });

            await handleTrackStart(currentTrack, getNextTrack);

            expect(mocks.extractPeaksForAnalysis).not.toHaveBeenCalled();
        });

        it('preloads next track audio when crossfade is enabled', async () => {
            const { handleTrackStart, resetPreloadState } = await import(
                './crossfadePreloadManager'
            );

            mocks.getState.mockReturnValue({
                items: [{ item: { id: 'current' } }, { item: { id: 'next-in-queue' } }],
                currentIndex: 0
            });

            resetPreloadState();

            const currentTrack = {
                itemId: 'current',
                url: 'https://example.com/current.mp3',
                volume: 1,
                muted: false
            };

            const getNextTrack = () => ({
                itemId: 'next-in-queue',
                url: 'https://example.com/next.mp3',
                volume: 1,
                muted: false
            });

            await handleTrackStart(currentTrack, getNextTrack);

            expect(mocks.preloadNextTrack).toHaveBeenCalledWith(
                expect.objectContaining({
                    itemId: 'next-in-queue',
                    url: 'https://example.com/next.mp3'
                })
            );
        });

        it('skips audio preload when crossfade is disabled', async () => {
            mocks.isCrossfadeEnabled.mockReturnValue(false);

            const { handleTrackStart, resetPreloadState } = await import(
                './crossfadePreloadManager'
            );

            mocks.getState.mockReturnValue({
                items: [{ item: { id: 'current' } }, { item: { id: 'next-in-queue' } }],
                currentIndex: 0
            });

            resetPreloadState();

            const currentTrack = {
                itemId: 'current',
                url: 'https://example.com/current.mp3',
                volume: 1,
                muted: false
            };

            const getNextTrack = () => ({
                itemId: 'next-in-queue',
                url: 'https://example.com/next.mp3',
                volume: 1,
                muted: false
            });

            await handleTrackStart(currentTrack, getNextTrack);

            expect(mocks.preloadNextTrack).not.toHaveBeenCalled();
        });
    });

    describe('resetPreloadState', () => {
        it('resets preload state for new track', async () => {
            const { resetPreloadState, getCurrentPreloadState } = await import(
                './crossfadePreloadManager'
            );

            resetPreloadState();
            const state = getCurrentPreloadState();

            expect(state.hasImmediateTriggered).toBe(false);
            expect(state.hasFallbackTriggered).toBe(false);
            expect(state.currentItemId).toBe(null);
            expect(state.preloadTriggerType).toBe(null);
        });
    });

    describe('getCurrentPreloadState', () => {
        it('returns current preload state', async () => {
            const { getCurrentPreloadState } = await import('./crossfadePreloadManager');

            const state = getCurrentPreloadState();

            expect(state).toHaveProperty('hasImmediateTriggered');
            expect(state).toHaveProperty('hasFallbackTriggered');
            expect(state).toHaveProperty('currentItemId');
            expect(state).toHaveProperty('preloadTriggerType');
        });
    });
});

/* eslint-enable sonarjs/no-identical-functions */
