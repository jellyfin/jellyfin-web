/**
 * Queue Store - Queue Management
 *
 * Zustand store for managing playback queue and queue-related operations.
 * Handles queue items, navigation, shuffle/repeat modes, and queue persistence.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { PlayableItem, QueueItem, QueueState, RepeatMode, ShuffleMode } from './types';
import { logger } from '../utils/logger';

export interface QueueStoreState extends Omit<QueueState, 'shuffleMode' | 'repeatMode'> {
    // Queue state (extends base QueueState)
    items: QueueItem[];
    currentIndex: number;
    startPosition: number;

    // Queue modes (from parent store)
    shuffleMode: ShuffleMode;
    repeatMode: RepeatMode;

    // Additional state
    isShuffled: boolean;
    lastPlayedItemId: string | null;
    queueHistory: string[];
}

export interface QueueStoreActions {
    // Queue modification
    setQueue: (items: PlayableItem[], startIndex?: number) => void;
    addToQueue: (items: PlayableItem[], position?: number) => void;
    removeFromQueue: (itemIds: string[]) => void;
    clearQueue: () => void;

    // Navigation
    setCurrentIndex: (index: number) => void;
    next: () => void;
    prev: () => void;
    playItem: (itemId: string) => void;

    // Queue ordering
    shuffle: () => void;
    unshuffle: () => void;
    moveItem: (fromIndex: number, toIndex: number) => void;

    // Mode management
    setRepeatMode: (mode: RepeatMode) => void;
    setShuffleMode: (mode: ShuffleMode) => void;

    // Position management
    setStartPosition: (position: number) => void;
    getStartPosition: () => number;

    // History
    addToHistory: (itemId: string) => void;
    clearHistory: () => void;

    // Persistence
    saveQueue: () => void;
    loadQueue: () => void;
}

const generateQueueId = (): string => {
    return `queue-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const createQueueItems = (items: PlayableItem[]): QueueItem[] => {
    return items.map((item, index) => ({
        id: generateQueueId(),
        item,
        index,
        addedAt: new Date()
    }));
};

const getInitialState = (): QueueStoreState => ({
    items: [],
    currentIndex: 0,
    startPosition: 0,
    shuffleMode: 'Sorted',
    repeatMode: 'RepeatNone',
    isShuffled: false,
    lastPlayedItemId: null,
    queueHistory: []
});

const PERSISTENCE_KEY = 'jellyfin-queue-state';

export const useQueueStore = create<QueueStoreState & QueueStoreActions>()(
    subscribeWithSelector((set, get) => {
        // Load persisted state
        let persistedState: Partial<QueueStoreState> = {};
        try {
            const stored = localStorage.getItem(PERSISTENCE_KEY);
            if (stored) {
                persistedState = JSON.parse(stored);
            }
        } catch (e) {
            logger.warn('Failed to load persisted queue state', { component: 'queueStore' }, e as Error);
        }

        const initialState = getInitialState();

        return {
            ...initialState,
            ...persistedState,

            setQueue: (items, startIndex = 0) => {
                const queueItems = createQueueItems(items);

                set({
                    items: queueItems,
                    currentIndex: Math.min(startIndex, queueItems.length - 1),
                    startPosition: 0,
                    queueHistory: [],
                    isShuffled: false
                });

                get().saveQueue();
            },

            addToQueue: (items, position) => {
                const { items: currentItems } = get();
                const queueItems = createQueueItems(items);

                const newItems = [...currentItems];
                if (position !== undefined && position >= 0 && position < newItems.length) {
                    newItems.splice(position, 0, ...queueItems);
                } else {
                    newItems.push(...queueItems);
                }

                const updatedItems = newItems.map((item, index) => ({
                    ...item,
                    index
                }));

                set({
                    items: updatedItems,
                    currentIndex: position ?? currentItems.length
                });

                get().saveQueue();
            },

            removeFromQueue: (itemIds) => {
                const { items, currentIndex } = get();

                const toRemove = new Set(itemIds);
                const filteredItems = items.filter(item => !toRemove.has(item.item.id));
                const removedBeforeCurrent = items
                    .slice(0, currentIndex)
                    .some(item => toRemove.has(item.item.id));

                const updatedItems = filteredItems.map((item, index) => ({
                    ...item,
                    index
                }));

                let newIndex = currentIndex;
                if (removedBeforeCurrent && updatedItems.length > 0) {
                    newIndex = Math.max(0, currentIndex - 1);
                } else if (currentIndex >= updatedItems.length) {
                    newIndex = Math.max(0, updatedItems.length - 1);
                }

                set({
                    items: updatedItems,
                    currentIndex: newIndex
                });

                get().saveQueue();
            },

            clearQueue: () => {
                set({
                    items: [],
                    currentIndex: 0,
                    startPosition: 0,
                    queueHistory: [],
                    lastPlayedItemId: null,
                    isShuffled: false
                });

                get().saveQueue();
            },

            setCurrentIndex: (index) => {
                const { items } = get();

                if (index >= 0 && index < items.length) {
                    set({ currentIndex: index });
                }
            },

            next: () => {
                const { items, currentIndex, repeatMode } = get();
                const lastIndex = items.length - 1;

                if (items.length === 0) return;

                switch (repeatMode) {
                    case 'RepeatOne':
                        set({ currentIndex });
                        break;

                    case 'RepeatAll':
                        if (currentIndex >= lastIndex) {
                            set({ currentIndex: 0 });
                        } else {
                            set({ currentIndex: currentIndex + 1 });
                        }
                        break;

                    case 'RepeatNone':
                    default:
                        if (currentIndex < lastIndex) {
                            set({ currentIndex: currentIndex + 1 });
                        }
                        break;
                }
            },

            prev: () => {
                const { items, currentIndex } = get();

                if (items.length === 0) return;

                if (currentIndex > 0) {
                    set({ currentIndex: currentIndex - 1 });
                }
            },

            playItem: (itemId) => {
                const { items } = get();
                const index = items.findIndex(item => item.item.id === itemId);

                if (index !== -1) {
                    set({ currentIndex: index });
                }
            },

            shuffle: () => {
                const { items, currentIndex } = get();

                if (items.length <= 2) return;

                const currentItem = items[currentIndex];
                const remainingItems = items.filter(item => item.id !== currentItem.id);

                for (let i = remainingItems.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [remainingItems[i], remainingItems[j]] = [remainingItems[j], remainingItems[i]];
                }

                const shuffledItems = [currentItem, ...remainingItems];
                const updatedItems = shuffledItems.map((item, index) => ({
                    ...item,
                    index
                }));

                set({
                    items: updatedItems,
                    currentIndex: 0,
                    isShuffled: true,
                    shuffleMode: 'Shuffle'
                });

                get().saveQueue();
            },

            unshuffle: () => {
                const { items, queueHistory } = get();

                if (queueHistory.length === 0) return;

                const restoredItems = queueHistory.map((id, index) =>
                    items.find(item => item.item.id === id) || items[index]
                ).filter(Boolean);

                const updatedItems = restoredItems.map((item, index) => ({
                    ...item,
                    index
                }));

                set({
                    items: updatedItems,
                    currentIndex: 0,
                    isShuffled: false,
                    shuffleMode: 'Sorted',
                    queueHistory: []
                });

                get().saveQueue();
            },

            moveItem: (fromIndex, toIndex) => {
                const { items } = get();

                if (fromIndex < 0 || fromIndex >= items.length ||
                    toIndex < 0 || toIndex >= items.length) {
                    return;
                }

                const newItems = [...items];
                const [movedItem] = newItems.splice(fromIndex, 1);
                newItems.splice(toIndex, 0, movedItem);

                const updatedItems = newItems.map((item, index) => ({
                    ...item,
                    index
                }));

                set({
                    items: updatedItems,
                    currentIndex: toIndex
                });

                get().saveQueue();
            },

            setRepeatMode: (mode) => {
                set({ repeatMode: mode });
                get().saveQueue();
            },

            setShuffleMode: (mode) => {
                const { isShuffled } = get();

                set({ shuffleMode: mode });

                if (mode === 'Shuffle' && !isShuffled) {
                    get().shuffle();
                } else if (mode === 'Sorted' && isShuffled) {
                    get().unshuffle();
                }

                get().saveQueue();
            },

            setStartPosition: (position) => {
                set({ startPosition: position });
            },

            getStartPosition: () => {
                const { startPosition, currentIndex, items } = get();

                if (startPosition > 0) {
                    set({ startPosition: 0 });
                    return startPosition;
                }

                const currentItem = items[currentIndex];
                if (currentItem?.item.playbackPosition) {
                    return currentItem.item.playbackPosition;
                }

                return 0;
            },

            addToHistory: (itemId) => {
                const { queueHistory, lastPlayedItemId } = get();

                if (itemId === lastPlayedItemId) return;

                const newHistory = [itemId, ...queueHistory].slice(0, 50);

                set({
                    queueHistory: newHistory,
                    lastPlayedItemId: itemId
                });
            },

            clearHistory: () => {
                set({
                    queueHistory: [],
                    lastPlayedItemId: null
                });

                get().saveQueue();
            },

            saveQueue: () => {
                const { items, currentIndex, startPosition, shuffleMode, repeatMode, queueHistory } = get();

                try {
                    const stateToSave = {
                        items: items.map(item => ({
                            ...item,
                            addedAt: item.addedAt.toISOString()
                        })),
                        currentIndex,
                        startPosition,
                        shuffleMode,
                        repeatMode,
                        queueHistory,
                        savedAt: Date.now()
                    };

                    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(stateToSave));
                } catch (e) {
                    logger.warn('Failed to save queue state', { component: 'queueStore' }, e as Error);
                }
            },

            loadQueue: () => {
                try {
                    const stored = localStorage.getItem(PERSISTENCE_KEY);
                    if (stored) {
                        const state = JSON.parse(stored);

                        const maxAge = 7 * 24 * 60 * 60 * 1000;
                        if (state.savedAt && Date.now() - state.savedAt > maxAge) {
                            localStorage.removeItem(PERSISTENCE_KEY);
                            return;
                        }

                        set({
                            items: state.items.map((item: QueueItem) => ({
                                ...item,
                                addedAt: new Date(item.addedAt)
                            })),
                            currentIndex: Math.min(state.currentIndex || 0, (state.items?.length || 1) - 1),
                            startPosition: state.startPosition || 0,
                            shuffleMode: state.shuffleMode || 'Sorted',
                            repeatMode: state.repeatMode || 'RepeatNone',
                            queueHistory: state.queueHistory || [],
                            isShuffled: state.shuffleMode === 'Shuffle'
                        });
                    }
                } catch (e) {
                    logger.warn('Failed to load persisted queue state', { component: 'queueStore' }, e as Error);
                }
            }
        };
    })
);

// Selectors
export const selectQueueItems = (state: QueueStoreState & QueueStoreActions) => state.items;
export const selectCurrentIndex = (state: QueueStoreState & QueueStoreActions) => state.currentIndex;
export const selectCurrentQueueItem = (state: QueueStoreState & QueueStoreActions) =>
    state.items[state.currentIndex] || null;
export const selectIsEmpty = (state: QueueStoreState & QueueStoreActions) => state.items.length === 0;
export const selectQueueLength = (state: QueueStoreState & QueueStoreActions) => state.items.length;
export const selectRepeatMode = (state: QueueStoreState & QueueStoreActions) => state.repeatMode;
export const selectShuffleMode = (state: QueueStoreState & QueueStoreActions) => state.shuffleMode;
export const selectIsShuffled = (state: QueueStoreState & QueueStoreActions) => state.isShuffled;
