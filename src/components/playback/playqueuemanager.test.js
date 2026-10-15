import { describe, it, expect, beforeEach, vi } from 'vitest';
import PlayQueueManager from './playqueuemanager';

// Mock the randomInt function to make tests deterministic
vi.mock('../../utils/number.ts', () => ({
    randomInt: vi.fn((min, max) => Math.floor((min + max) / 2))
}));

describe('PlayQueueManager', () => {
    let manager;
    let testItems;

    beforeEach(() => {
        manager = new PlayQueueManager();
        testItems = [
            { Id: '1', Name: 'Item 1' },
            { Id: '2', Name: 'Item 2' },
            { Id: '3', Name: 'Item 3' },
            { Id: '4', Name: 'Item 4' },
            { Id: '5', Name: 'Item 5' }
        ];
    });

    describe('RepeatAll with Shuffle', () => {
        it('should NOT reshuffle when peeking at next item repeatedly', () => {
            manager.setPlaylist(testItems);
            manager.setPlaylistIndex(0);
            manager.setRepeatMode('RepeatAll');
            manager.setShuffleMode('Shuffle');

            const initialPlaylist = manager.getPlaylist();
            const initialOrder = initialPlaylist.map(item => item.Id);

            const lastIndex = initialPlaylist.length - 1;
            manager.setPlaylistIndex(lastIndex);

            const peekOrder1 = manager.getPlaylist().map(item => item.Id);
            manager.getNextItemInfo();
            const peekOrder2 = manager.getPlaylist().map(item => item.Id);
            manager.getNextItemInfo();
            const peekOrder3 = manager.getPlaylist().map(item => item.Id);

            expect(peekOrder1).toEqual(peekOrder2);
            expect(peekOrder2).toEqual(peekOrder3);
        });

        it('should reshuffle when actually advancing past the end with RepeatAll and Shuffle', () => {
            manager.setPlaylist(testItems);
            manager.setPlaylistIndex(0);
            manager.setRepeatMode('RepeatAll');
            manager.setShuffleMode('Shuffle');

            const initialPlaylist = manager.getPlaylist();
            const initialOrder = initialPlaylist.map(item => item.Id);

            const lastIndex = initialPlaylist.length - 1;
            manager.setPlaylistIndex(lastIndex);

            const beforeAdvance = manager.getPlaylist().map(item => item.Id);
            manager.setPlaylistIndex(0);
            const afterAdvance = manager.getPlaylist().map(item => item.Id);

            expect(afterAdvance).not.toEqual(beforeAdvance);
            expect(afterAdvance).not.toEqual(initialOrder);
        });

        it('should not reshuffle when advancing within the queue', () => {
            manager.setPlaylist(testItems);
            manager.setPlaylistIndex(0);
            manager.setRepeatMode('RepeatAll');
            manager.setShuffleMode('Shuffle');

            const initialPlaylist = manager.getPlaylist();
            const initialOrder = initialPlaylist.map(item => item.Id);

            manager.setPlaylistIndex(2);
            const newPlaylist = manager.getPlaylist();
            const newOrder = newPlaylist.map(item => item.Id);

            expect(newOrder).toEqual(initialOrder);
        });

        it('should not reshuffle when RepeatAll is disabled', () => {
            manager.setPlaylist(testItems);
            manager.setPlaylistIndex(0);
            manager.setRepeatMode('RepeatNone');
            manager.setShuffleMode('Shuffle');

            const initialPlaylist = manager.getPlaylist();
            const initialOrder = initialPlaylist.map(item => item.Id);

            const lastIndex = initialPlaylist.length - 1;
            manager.setPlaylistIndex(lastIndex);

            manager.setPlaylistIndex(0);
            const newPlaylist = manager.getPlaylist();
            const newOrder = newPlaylist.map(item => item.Id);

            expect(newOrder).toEqual(initialOrder);
        });

        it('should not reshuffle when Shuffle is disabled', () => {
            manager.setPlaylist(testItems);
            manager.setPlaylistIndex(0);
            manager.setRepeatMode('RepeatAll');

            const initialOrder = testItems.map(item => item.Id);

            const lastIndex = testItems.length - 1;
            manager.setPlaylistIndex(lastIndex);

            manager.setPlaylistIndex(0);
            const newPlaylist = manager.getPlaylist();
            const newOrder = newPlaylist.map(item => item.Id);

            expect(newOrder).toEqual(initialOrder);
        });

        it('should not place the last-played track in the first position after reshuffle', () => {
            manager.setPlaylist(testItems);
            manager.setPlaylistIndex(0);
            manager.setRepeatMode('RepeatAll');
            manager.setShuffleMode('Shuffle');

            const lastIndex = testItems.length - 1;
            manager.setPlaylistIndex(lastIndex);

            const lastPlayedId = manager.getCurrentItem().Id;

            manager.setPlaylistIndex(0);

            const firstItemAfterReshuffle = manager.getPlaylist()[0].Id;

            expect(firstItemAfterReshuffle).not.toBe(lastPlayedId);
        });
    });
});
