import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useQueueStore, selectQueueItems, selectCurrentIndex, selectCurrentQueueItem, selectIsEmpty, selectQueueLength, selectRepeatMode, selectShuffleMode, selectIsShuffled } from './queueStore';
import type { PlayableItem, QueueItem } from './types';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

const makeItem = (id: string, name: string = `Song ${id}`): PlayableItem => ({
    id,
    name,
    mediaType: 'Audio',
    serverId: 'server-1',
    type: 'Audio'
});

describe('queueStore', () => {
    beforeEach(() => {
        localStorageMock.clear();
        useQueueStore.setState({
            items: [],
            currentIndex: 0,
            startPosition: 0,
            shuffleMode: 'Sorted',
            repeatMode: 'RepeatNone',
            isShuffled: false,
            lastPlayedItemId: null,
            queueHistory: []
        });
    });

    afterEach(() => {
        localStorageMock.clear();
    });

    describe('initial state', () => {
        it('should have empty items array', () => {
            const state = useQueueStore.getState();
            expect(state.items).toEqual([]);
        });

        it('should have currentIndex of 0', () => {
            const state = useQueueStore.getState();
            expect(state.currentIndex).toBe(0);
        });

        it('should have startPosition of 0', () => {
            const state = useQueueStore.getState();
            expect(state.startPosition).toBe(0);
        });

        it('should have shuffleMode as Sorted', () => {
            const state = useQueueStore.getState();
            expect(state.shuffleMode).toBe('Sorted');
        });

        it('should have repeatMode as RepeatNone', () => {
            const state = useQueueStore.getState();
            expect(state.repeatMode).toBe('RepeatNone');
        });
    });

    describe('setQueue', () => {
        it('should set queue with items', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2')
            ];

            useQueueStore.getState().setQueue(items);

            const state = useQueueStore.getState();
            expect(state.items).toHaveLength(2);
            expect(state.items[0].item.id).toBe('1');
            expect(state.currentIndex).toBe(0);
        });

        it('should set currentIndex from startIndex parameter', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2'),
                makeItem('3')
            ];

            useQueueStore.getState().setQueue(items, 2);

            const state = useQueueStore.getState();
            expect(state.currentIndex).toBe(2);
        });

        it('should clamp startIndex to valid range', () => {
            const items: PlayableItem[] = [
                makeItem('1')
            ];

            useQueueStore.getState().setQueue(items, 10);

            const state = useQueueStore.getState();
            expect(state.currentIndex).toBe(0);
        });

        it('should reset isShuffled flag', () => {
            const items: PlayableItem[] = [
                makeItem('1')
            ];

            useQueueStore.getState().setQueue(items);

            const state = useQueueStore.getState();
            expect(state.isShuffled).toBe(false);
        });

        it('should reset queueHistory', () => {
            const items: PlayableItem[] = [
                makeItem('1')
            ];

            useQueueStore.getState().setQueue(items);

            const state = useQueueStore.getState();
            expect(state.queueHistory).toEqual([]);
        });
    });

    describe('addToQueue', () => {
        it('should add items to end of queue', () => {
            const initial: PlayableItem[] = [makeItem('1')];
            useQueueStore.getState().setQueue(initial);

            const newItems: PlayableItem[] = [makeItem('2')];
            useQueueStore.getState().addToQueue(newItems);

            const state = useQueueStore.getState();
            expect(state.items).toHaveLength(2);
            expect(state.items[1].item.id).toBe('2');
        });

        it('should add items at specific position', () => {
            const initial: PlayableItem[] = [
                makeItem('1'),
                makeItem('3')
            ];
            useQueueStore.getState().setQueue(initial);

            const newItems: PlayableItem[] = [makeItem('2')];
            useQueueStore.getState().addToQueue(newItems, 1);

            const state = useQueueStore.getState();
            expect(state.items).toHaveLength(3);
            expect(state.items[1].item.id).toBe('2');
        });

        it('should preserve current index after adding', () => {
            const initial: PlayableItem[] = [
                makeItem('1'),
                makeItem('2')
            ];
            useQueueStore.getState().setQueue(initial, 1);

            const newItems: PlayableItem[] = [makeItem('3')];
            useQueueStore.getState().addToQueue(newItems);

            const state = useQueueStore.getState();
            expect(state.currentIndex).toBe(1);
        });
    });

    describe('removeFromQueue', () => {
        it('should remove items by id', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2'),
                makeItem('3')
            ];
            useQueueStore.getState().setQueue(items);

            useQueueStore.getState().removeFromQueue(['2']);

            const state = useQueueStore.getState();
            expect(state.items).toHaveLength(2);
            expect(state.items.map(q => q.item.id)).toEqual(['1', '3']);
        });

        it('should adjust currentIndex when removing before current', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2'),
                makeItem('3')
            ];
            useQueueStore.getState().setQueue(items, 2);

            useQueueStore.getState().removeFromQueue(['1']);

            const state = useQueueStore.getState();
            expect(state.currentIndex).toBe(1);
        });

        it('should adjust currentIndex when removing current item', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2'),
                makeItem('3')
            ];
            useQueueStore.getState().setQueue(items, 1);

            useQueueStore.getState().removeFromQueue(['2']);

            const state = useQueueStore.getState();
            expect(state.currentIndex).toBe(0);
        });
    });

    describe('clearQueue', () => {
        it('should clear all items', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2')
            ];
            useQueueStore.getState().setQueue(items);

            useQueueStore.getState().clearQueue();

            const state = useQueueStore.getState();
            expect(state.items).toEqual([]);
            expect(state.currentIndex).toBe(0);
        });

        it('should reset all flags', () => {
            const items: PlayableItem[] = [makeItem('1')];
            useQueueStore.getState().setQueue(items);

            useQueueStore.getState().clearQueue();

            const state = useQueueStore.getState();
            expect(state.isShuffled).toBe(false);
            expect(state.queueHistory).toEqual([]);
            expect(state.lastPlayedItemId).toBeNull();
            expect(state.startPosition).toBe(0);
        });
    });

    describe('setCurrentIndex', () => {
        it('should set valid currentIndex', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2')
            ];
            useQueueStore.getState().setQueue(items);

            useQueueStore.getState().setCurrentIndex(1);

            expect(useQueueStore.getState().currentIndex).toBe(1);
        });

        it('should not set invalid currentIndex', () => {
            const items: PlayableItem[] = [makeItem('1')];
            useQueueStore.getState().setQueue(items);

            useQueueStore.getState().setCurrentIndex(5);

            expect(useQueueStore.getState().currentIndex).toBe(0);
        });
    });

    describe('next', () => {
        it('should move to next item with RepeatNone', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2'),
                makeItem('3')
            ];
            useQueueStore.getState().setQueue(items);

            useQueueStore.getState().next();

            expect(useQueueStore.getState().currentIndex).toBe(1);
        });

        it('should wrap to start with RepeatAll', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2')
            ];
            useQueueStore.getState().setQueue(items);
            useQueueStore.getState().setRepeatMode('RepeatAll');
            useQueueStore.getState().next();
            useQueueStore.getState().next();

            expect(useQueueStore.getState().currentIndex).toBe(0);
        });

        it('should stay on same item with RepeatOne', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2')
            ];
            useQueueStore.getState().setQueue(items, 1);
            useQueueStore.getState().setRepeatMode('RepeatOne');

            useQueueStore.getState().next();

            expect(useQueueStore.getState().currentIndex).toBe(1);
        });
    });

    describe('prev', () => {
        it('should move to previous item', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2'),
                makeItem('3')
            ];
            useQueueStore.getState().setQueue(items, 2);

            useQueueStore.getState().prev();

            expect(useQueueStore.getState().currentIndex).toBe(1);
        });

        it('should not go below 0', () => {
            const items: PlayableItem[] = [makeItem('1')];
            useQueueStore.getState().setQueue(items);

            useQueueStore.getState().prev();

            expect(useQueueStore.getState().currentIndex).toBe(0);
        });
    });

    describe('playItem', () => {
        it('should play item by id', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2'),
                makeItem('3')
            ];
            useQueueStore.getState().setQueue(items);

            useQueueStore.getState().playItem('3');

            expect(useQueueStore.getState().currentIndex).toBe(2);
        });

        it('should not change index for non-existent item', () => {
            const items: PlayableItem[] = [makeItem('1')];
            useQueueStore.getState().setQueue(items);

            useQueueStore.getState().playItem('non-existent');

            expect(useQueueStore.getState().currentIndex).toBe(0);
        });
    });

    describe('shuffle', () => {
        it('should shuffle queue', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2'),
                makeItem('3')
            ];
            useQueueStore.getState().setQueue(items);

            useQueueStore.getState().shuffle();

            const state = useQueueStore.getState();
            expect(state.isShuffled).toBe(true);
            expect(state.shuffleMode).toBe('Shuffle');
            // Current item should remain at index 0 after shuffle
            expect(state.currentIndex).toBe(0);
        });

        it('should not shuffle queue with less than 3 items', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2')
            ];
            useQueueStore.getState().setQueue(items);

            useQueueStore.getState().shuffle();

            const state = useQueueStore.getState();
            expect(state.isShuffled).toBe(false);
        });
    });

    describe('moveItem', () => {
        it('should move item to new position', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2'),
                makeItem('3')
            ];
            useQueueStore.getState().setQueue(items);

            useQueueStore.getState().moveItem(2, 0);

            const state = useQueueStore.getState();
            expect(state.items[0].item.id).toBe('3');
            expect(state.items[1].item.id).toBe('1');
        });

        it('should not move with invalid indices', () => {
            const items: PlayableItem[] = [makeItem('1')];
            useQueueStore.getState().setQueue(items);

            useQueueStore.getState().moveItem(5, 0);

            expect(useQueueStore.getState().items[0].item.id).toBe('1');
        });
    });

    describe('setRepeatMode', () => {
        it('should set repeat mode', () => {
            useQueueStore.getState().setRepeatMode('RepeatOne');
            expect(useQueueStore.getState().repeatMode).toBe('RepeatOne');

            useQueueStore.getState().setRepeatMode('RepeatAll');
            expect(useQueueStore.getState().repeatMode).toBe('RepeatAll');

            useQueueStore.getState().setRepeatMode('RepeatNone');
            expect(useQueueStore.getState().repeatMode).toBe('RepeatNone');
        });
    });

    describe('setShuffleMode', () => {
        it('should set shuffle mode', () => {
            useQueueStore.getState().setShuffleMode('Shuffle');
            expect(useQueueStore.getState().shuffleMode).toBe('Shuffle');

            useQueueStore.getState().setShuffleMode('Sorted');
            expect(useQueueStore.getState().shuffleMode).toBe('Sorted');
        });
    });

    describe('history', () => {
        it('should add to history', () => {
            useQueueStore.getState().addToHistory('song1');
            useQueueStore.getState().addToHistory('song2');

            const state = useQueueStore.getState();
            expect(state.queueHistory).toEqual(['song2', 'song1']);
        });

        it('should limit history to 50 items', () => {
            for (let i = 0; i < 60; i++) {
                useQueueStore.getState().addToHistory(`song${i}`);
            }

            const state = useQueueStore.getState();
            expect(state.queueHistory).toHaveLength(50);
        });

        it('should clear history', () => {
            useQueueStore.getState().addToHistory('song1');
            useQueueStore.getState().clearHistory();

            const state = useQueueStore.getState();
            expect(state.queueHistory).toEqual([]);
            expect(state.lastPlayedItemId).toBeNull();
        });
    });

    describe('persistence', () => {
        it('should save and load queue state', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2')
            ];
            useQueueStore.getState().setQueue(items, 1);

            const stored = localStorageMock.getItem('jellyfin-queue-state');
            expect(stored).toBeTruthy();

            const parsed = JSON.parse(stored!);
            expect(parsed.items).toHaveLength(2);
            expect(parsed.currentIndex).toBe(1);
        });

        it('should handle corrupted localStorage gracefully', () => {
            localStorageMock.setItem('jellyfin-queue-state', 'invalid json');

            useQueueStore.getState().loadQueue();

            expect(useQueueStore.getState().items).toEqual([]);
        });
    });

    describe('selectors', () => {
        it('should select queue items', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2')
            ];
            useQueueStore.getState().setQueue(items);

            const state = useQueueStore.getState();
            expect(selectQueueItems(state)).toHaveLength(2);
        });

        it('should select current index', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2')
            ];
            useQueueStore.getState().setQueue(items, 1);

            const state = useQueueStore.getState();
            expect(selectCurrentIndex(state)).toBe(1);
        });

        it('should select current queue item', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2')
            ];
            useQueueStore.getState().setQueue(items, 1);

            const state = useQueueStore.getState();
            const current = selectCurrentQueueItem(state);
            expect(current?.item.id).toBe('2');
        });

        it('should select isEmpty', () => {
            useQueueStore.getState().clearQueue();
            let state = useQueueStore.getState();
            expect(selectIsEmpty(state)).toBe(true);

            const items: PlayableItem[] = [makeItem('1')];
            useQueueStore.getState().setQueue(items);
            state = useQueueStore.getState();
            expect(selectIsEmpty(state)).toBe(false);
        });

        it('should select queue length', () => {
            const items: PlayableItem[] = [
                makeItem('1'),
                makeItem('2'),
                makeItem('3')
            ];
            useQueueStore.getState().setQueue(items);

            const state = useQueueStore.getState();
            expect(selectQueueLength(state)).toBe(3);
        });
    });
});
