import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    return {
        useMediaStore: {
            getState: vi.fn()
        },
        useQueueStore: {
            getState: vi.fn()
        }
    };
});

vi.mock('../../store', () => ({
    useMediaStore: mocks.useMediaStore,
    useQueueStore: mocks.useQueueStore
}));

import { buildTrackInfo, getNextTrackInfo } from './crossfadePreloadHandler';

describe('crossfadePreloadHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.useMediaStore.getState.mockReturnValue({
            currentItem: null,
            streamInfo: null
        });
        mocks.useQueueStore.getState.mockReturnValue({
            items: [],
            currentIndex: 0
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getNextTrackInfo', () => {
        it('returns null when queue is empty', () => {
            mocks.useQueueStore.getState.mockReturnValue({
                items: [],
                currentIndex: 0
            });
            mocks.useMediaStore.getState.mockReturnValue({
                currentItem: { id: 'current' },
                streamInfo: { url: 'https://example.com/current.mp3' }
            });

            const result = getNextTrackInfo();
            expect(result).toBeNull();
        });

        it('returns null when at end of queue', () => {
            mocks.useQueueStore.getState.mockReturnValue({
                items: [{ item: { id: 'item-1' } }, { item: { id: 'item-2' } }],
                currentIndex: 1
            });
            mocks.useMediaStore.getState.mockReturnValue({
                currentItem: { id: 'item-2' },
                streamInfo: { url: 'https://example.com/item2.mp3' }
            });

            const result = getNextTrackInfo();
            expect(result).toBeNull();
        });

        it('returns next track info when available in queue', () => {
            mocks.useQueueStore.getState.mockReturnValue({
                items: [
                    {
                        item: { id: 'item-1', streamInfo: { url: 'https://example.com/item1.mp3' } }
                    },
                    {
                        item: { id: 'item-2', streamInfo: { url: 'https://example.com/item2.mp3' } }
                    },
                    { item: { id: 'item-3', streamInfo: { url: 'https://example.com/item3.mp3' } } }
                ],
                currentIndex: 0
            });
            mocks.useMediaStore.getState.mockReturnValue({
                currentItem: { id: 'item-1' },
                streamInfo: { url: 'https://example.com/item1.mp3' }
            });

            const result = getNextTrackInfo();

            expect(result).not.toBeNull();
            expect(result?.itemId).toBe('item-2');
            expect(result?.url).toBe('https://example.com/item2.mp3');
        });

        it('returns null when currentItem is null', () => {
            mocks.useQueueStore.getState.mockReturnValue({
                items: [{ item: { id: 'item-1' } }, { item: { id: 'item-2' } }],
                currentIndex: 0
            });
            mocks.useMediaStore.getState.mockReturnValue({
                currentItem: null,
                streamInfo: null
            });

            const result = getNextTrackInfo();
            expect(result).toBeNull();
        });

        it('returns null when streamInfo is null', () => {
            mocks.useQueueStore.getState.mockReturnValue({
                items: [{ item: { id: 'item-1' } }, { item: { id: 'item-2' } }],
                currentIndex: 0
            });
            mocks.useMediaStore.getState.mockReturnValue({
                currentItem: { id: 'current' },
                streamInfo: null
            });

            const result = getNextTrackInfo();
            expect(result).toBeNull();
        });
    });

    describe('buildTrackInfo', () => {
        it('builds track info from item', () => {
            const item = {
                id: 'test-item',
                streamInfo: { url: 'https://example.com/test.mp3' }
            };

            const result = buildTrackInfo(item);

            expect(result).not.toBeNull();
            expect(result?.itemId).toBe('test-item');
            expect(result?.url).toBe('https://example.com/test.mp3');
            expect(result?.crossOrigin).toBe('anonymous');
        });

        it('returns null for null item', () => {
            const result = buildTrackInfo(null);
            expect(result).toBeNull();
        });

        it('returns null for undefined item', () => {
            const result = buildTrackInfo(undefined);
            expect(result).toBeNull();
        });
    });
});
