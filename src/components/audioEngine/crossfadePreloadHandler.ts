import { playbackManager } from '../playback/playbackmanager';
import Events from '../../utils/events';
import { handleTrackStart, handlePlaybackTimeUpdate, handleManualSkip } from './crossfadePreloadManager';

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

let currentTrackId: string | null = null;

function getNextTrackInfo(): TrackInfo | null {
    const player = playbackManager.getCurrentPlayer();
    if (!player) {
        return null;
    }

    const currentItem = playbackManager.currentItem(player);
    const currentMediaSource = playbackManager.currentMediaSource(player);

    if (!currentItem || !currentMediaSource) {
        return null;
    }

    return {
        itemId: currentItem.Id,
        url: currentMediaSource.Url,
        imageUrl: getTrackImageUrl(currentItem),
        backdropUrl: getTrackBackdropUrl(currentItem),
        artistLogoUrl: getTrackArtistLogoUrl(currentItem),
        discImageUrl: getTrackDiscImageUrl(currentItem),
        crossOrigin: 'anonymous',
        volume: 100,
        muted: false
    };
}

function getCurrentTrackInfo(): TrackInfo | null {
    const player = playbackManager.getCurrentPlayer();
    if (!player) {
        return null;
    }

    const currentItem = playbackManager.currentItem(player);
    const currentMediaSource = playbackManager.currentMediaSource(player);

    if (!currentItem || !currentMediaSource) {
        return null;
    }

    return {
        itemId: currentItem.Id,
        url: currentMediaSource.Url,
        imageUrl: getTrackImageUrl(currentItem),
        backdropUrl: getTrackBackdropUrl(currentItem),
        artistLogoUrl: getTrackArtistLogoUrl(currentItem),
        discImageUrl: getTrackDiscImageUrl(currentItem),
        crossOrigin: 'anonymous',
        volume: 100,
        muted: false
    };
}

function getTrackImageUrl(item: any): string | undefined {
    if (item?.ImageTags?.Primary) {
        const apiClient = (global as any).ApiClient(item.ServerId);
        return apiClient.getScaledImageUrl(item.Id, {
            type: 'Primary',
            tag: item.ImageTags.Primary,
            maxWidth: window.innerWidth
        });
    }
    return undefined;
}

function getTrackBackdropUrl(item: any): string | undefined {
    if (item?.BackdropImageTags?.length) {
        const apiClient = (global as any).ApiClient(item.ServerId);
        return apiClient.getScaledImageUrl(item.Id, {
            type: 'Backdrop',
            tag: item.BackdropImageTags[0],
            maxWidth: window.innerWidth
        });
    }
    return undefined;
}

function getTrackArtistLogoUrl(item: any): string | undefined {
    if (item?.ParentLogoImageTag) {
        const apiClient = (global as any).ApiClient(item.ServerId);
        return apiClient.getScaledImageUrl(item.ParentLogoItemId, {
            type: 'Logo',
            tag: item.ParentLogoImageTag,
            maxWidth: Math.min(window.innerWidth, 300)
        });
    }
    return undefined;
}

function getTrackDiscImageUrl(item: any): string | undefined {
    if (item?.ImageTags?.Disc) {
        const apiClient = (global as any).ApiClient(item.ServerId);
        return apiClient.getScaledImageUrl(item.Id, {
            type: 'Disc',
            tag: item.ImageTags.Disc,
            maxWidth: window.innerHeight * 0.8
        });
    }
    return undefined;
}

function onPlaybackStart() {
    const trackInfo = getCurrentTrackInfo();
    if (!trackInfo) {
        return;
    }
    
    currentTrackId = trackInfo.itemId;
    
    handleTrackStart(trackInfo, getNextTrackInfo);
    startProgressTracking();
}

function startProgressTracking() {
    if (currentTimeCheckInterval) {
        clearInterval(currentTimeCheckInterval);
    }
    
    currentTimeCheckInterval = setInterval(() => {
        const player = playbackManager.getCurrentPlayer();
        if (!player) return;
        
        const currentTime = player.currentTime?.() ?? 0;
        const duration = player.duration?.() ?? 0;
        
        if (currentTime && duration) {
            handlePlaybackTimeUpdate(
                { currentTime: () => currentTime, duration: () => duration },
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

function onPlaybackStop() {
    stopProgressTracking();
    currentTrackId = null;
}

function onPlayerChange() {
    stopProgressTracking();
}

export function initializeCrossfadePreloadHandler(): void {
    Events.on(playbackManager, 'playbackstart', onPlaybackStart);
    Events.on(playbackManager, 'playbackstop', onPlaybackStop);
    Events.on(playbackManager, 'playerchange', onPlayerChange);
    
    console.debug('[CrossfadePreloadHandler] Initialized');
}

export function destroyCrossfadePreloadHandler(): void {
    Events.off(playbackManager, 'playbackstart', onPlaybackStart);
    Events.off(playbackManager, 'playbackstop', onPlaybackStop);
    Events.off(playbackManager, 'playerchange', onPlayerChange);
    
    stopProgressTracking();
    currentTrackId = null;
    
    console.debug('[CrossfadePreloadHandler] Destroyed');
}
