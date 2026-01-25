import { handleTrackStart, handlePlaybackTimeUpdate } from './crossfadePreloadManager';
import { logger } from '../../utils/logger';
import { useMediaStore, usePlayerStore, useQueueStore } from '../../store';

let currentTimeCheckInterval: ReturnType<typeof setInterval> | null = null;
const TIME_UPDATE_INTERVAL = 500;

interface TrackInfo {
    itemId: string;
    url: string;
    imageUrl?: string;
    backdropUrl?: string;
    artistLogoUrl?: string;
    discImageUrl?: string;
    crossOrigin?: string | null;
    volume: number;
    muted: boolean;
    normalizationGainDb?: number;
}

// Subscriptions
let unsubs: (() => void)[] = [];

export function getNextTrackInfo(): TrackInfo | null {
    const queueStore = useQueueStore.getState();
    const mediaStore = useMediaStore.getState();
    const currentItem = mediaStore.currentItem;

    if (!currentItem) {
        return null;
    }

    const currentIndex = queueStore.currentIndex;
    const items = queueStore.items;

    if (items.length === 0 || currentIndex >= items.length - 1) {
        return null;
    }

    const nextQueueItem = items[currentIndex + 1];

    if (!nextQueueItem) {
        return null;
    }

    return buildTrackInfo(nextQueueItem.item);
}

function getCurrentTrackInfo(): TrackInfo | null {
    const state = useMediaStore.getState();
    const currentItem = state.currentItem;
    const streamInfo = state.streamInfo;

    if (!currentItem || !streamInfo) {
        return null;
    }

    return {
        itemId: currentItem.id,
        url: streamInfo.url || '',
        imageUrl: getTrackImageUrl(currentItem),
        backdropUrl: getTrackBackdropUrl(currentItem),
        artistLogoUrl: undefined, // Add if needed from store
        discImageUrl: undefined,
        crossOrigin: 'anonymous',
        volume: 100,
        muted: false
    };
}

function getTrackImageUrl(item: any): string | undefined {
    if (item?.imageUrl) return item.imageUrl;
    return undefined;
}

function getTrackBackdropUrl(item: any): string | undefined {
    if (item?.backdropUrl) return item.backdropUrl;
    return undefined;
}

export function buildTrackInfo(item: any): TrackInfo | null {
    if (!item) return null;

    if (!item.streamInfo) return null;

    return {
        itemId: item.id,
        url: item.streamInfo.url || '',
        imageUrl: getTrackImageUrl(item),
        backdropUrl: getTrackBackdropUrl(item),
        artistLogoUrl: undefined,
        discImageUrl: undefined,
        crossOrigin: 'anonymous',
        volume: 100,
        muted: false,
        normalizationGainDb: item.streamInfo.normalizationGainDb
    };
}

function startProgressTracking() {
    if (currentTimeCheckInterval) {
        clearInterval(currentTimeCheckInterval);
    }

    currentTimeCheckInterval = setInterval(() => {
        const { progress } = useMediaStore.getState();
        const { currentTime, duration } = progress;

        if (currentTime && duration) {
            handlePlaybackTimeUpdate(
                { currentTime: () => currentTime * 1000, duration: () => duration * 1000 },
                getNextTrackInfo
            );
        }
    }, TIME_UPDATE_INTERVAL);
}

function stopProgressTracking() {
    if (currentTimeCheckInterval) {
        clearInterval(currentTimeCheckInterval);
        currentTimeCheckInterval = null;
    }
}

export function initializeCrossfadePreloadHandler(): void {
    // 1. Listen for status changes (Start/Stop)
    const unsubStatus = useMediaStore.subscribe(
        state => state.status,
        status => {
            if (status === 'playing') {
                const trackInfo = getCurrentTrackInfo();
                if (trackInfo) {
                    handleTrackStart(trackInfo, getNextTrackInfo);
                    startProgressTracking();
                }
            } else if (status === 'idle') {
                stopProgressTracking();
            }
        }
    );

    // 2. Listen for player changes
    const unsubPlayer = usePlayerStore.subscribe(
        state => state.currentPlayer?.id,
        () => {
            stopProgressTracking();
        }
    );

    unsubs.push(unsubStatus, unsubPlayer);

    logger.debug('[CrossfadePreloadHandler] Initialized via Store', { component: 'CrossfadePreloadHandler' });
}

export function destroyCrossfadePreloadHandler(): void {
    for (const unsub of unsubs) {
        unsub();
    }
    unsubs = [];

    stopProgressTracking();

    logger.debug('[CrossfadePreloadHandler] Destroyed', { component: 'CrossfadePreloadHandler' });
}
