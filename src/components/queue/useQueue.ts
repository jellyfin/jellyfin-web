import { useCallback } from 'react';
import {
    useQueueStore,
    selectQueueItems,
    selectCurrentIndex,
    selectCurrentQueueItem,
    selectRepeatMode,
    selectShuffleMode,
    selectIsShuffled
} from 'store/queueStore';
import type { QueueItem, PlayableItem, RepeatMode, ShuffleMode } from 'store/types';

export interface QueueHooks {
    items: QueueItem[];
    currentIndex: number;
    currentItem: QueueItem | null;
    repeatMode: RepeatMode;
    shuffleMode: ShuffleMode;
    isShuffled: boolean;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    setQueue: (items: PlayableItem[], startIndex?: number) => void;
    addToQueue: (items: PlayableItem[], position?: number) => void;
    removeFromQueue: (itemIds: string[]) => void;
    clearQueue: () => void;
    setCurrentIndex: (index: number) => void;
    next: () => void;
    prev: () => void;
    shuffle: () => void;
    unshuffle: () => void;
    moveItem: (fromIndex: number, toIndex: number) => void;
    setRepeatMode: (mode: RepeatMode) => void;
    setShuffleMode: (mode: ShuffleMode) => void;
}

export const useQueue = (): QueueHooks => {
    const items = useQueueStore(selectQueueItems);
    const currentIndex = useQueueStore(selectCurrentIndex);
    const currentItem = useQueueStore(selectCurrentQueueItem);
    const repeatMode = useQueueStore(selectRepeatMode);
    const shuffleMode = useQueueStore(selectShuffleMode);
    const isShuffled = useQueueStore(selectIsShuffled);
    const isPlaying = useQueueStore(state => (state as any).isPlaying ?? false);
    const currentTime = useQueueStore(state => (state as any).currentTime ?? 0);
    const duration = useQueueStore(state => (state as any).duration ?? 0);

    const setQueue = useCallback((items: PlayableItem[], startIndex?: number) => {
        useQueueStore.getState().setQueue(items, startIndex);
    }, []);

    const addToQueue = useCallback((items: PlayableItem[], position?: number) => {
        useQueueStore.getState().addToQueue(items, position);
    }, []);

    const removeFromQueue = useCallback((itemIds: string[]) => {
        useQueueStore.getState().removeFromQueue(itemIds);
    }, []);

    const clearQueue = useCallback(() => {
        useQueueStore.getState().clearQueue();
    }, []);

    const setCurrentIndex = useCallback((index: number) => {
        useQueueStore.getState().setCurrentIndex(index);
    }, []);

    const next = useCallback(() => {
        useQueueStore.getState().next();
    }, []);

    const prev = useCallback(() => {
        useQueueStore.getState().prev();
    }, []);

    const shuffle = useCallback(() => {
        useQueueStore.getState().shuffle();
    }, []);

    const unshuffle = useCallback(() => {
        useQueueStore.getState().unshuffle();
    }, []);

    const moveItem = useCallback((fromIndex: number, toIndex: number) => {
        useQueueStore.getState().moveItem(fromIndex, toIndex);
    }, []);

    const setRepeatMode = useCallback((mode: RepeatMode) => {
        useQueueStore.getState().setRepeatMode(mode);
    }, []);

    const setShuffleMode = useCallback((mode: ShuffleMode) => {
        useQueueStore.getState().setShuffleMode(mode);
    }, []);

    return {
        items,
        currentIndex,
        currentItem,
        repeatMode,
        shuffleMode,
        isShuffled,
        isPlaying,
        currentTime,
        duration,
        setQueue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        setCurrentIndex,
        next,
        prev,
        shuffle,
        unshuffle,
        moveItem,
        setRepeatMode,
        setShuffleMode
    };
};

export default useQueue;
