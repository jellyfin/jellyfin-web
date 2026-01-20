import { handleTrackStart, handlePlaybackTimeUpdate } from './crossfadePreloadManager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { logger } from '../../utils/logger';
import { useMediaStore, usePlayerStore } from '../../store';

let currentTimeCheckInterval: ReturnType<typeof setInterval> | null = null;
const TIME_UPDATE_INTERVAL = 500;

type TrackInfo = {
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
};

// Subscriptions
let unsubs: (() => void)[] = [];

function getNextTrackInfo(): TrackInfo | null {
    // Note: In a fully reactive store, the store should know about the next item.
    // For now we get current but the crossfade logic will handle the "next" mapping.
    return getCurrentTrackInfo();
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
        (status) => {
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
    unsubs.forEach(unsub => unsub());
    unsubs = [];
    
    stopProgressTracking();
    
    logger.debug('[CrossfadePreloadHandler] Destroyed', { component: 'CrossfadePreloadHandler' });
}