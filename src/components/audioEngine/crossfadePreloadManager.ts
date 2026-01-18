import * as userSettings from '../../scripts/settings/userSettings';
import { xDuration, timeRunningOut, setXDuration } from './crossfader.logic';
import { preloadNextTrack, resetPreloadedTrack } from './crossfadeController';
import { imagePreloader } from '../../utils/imagePreloader';

type PreloadTriggerType = 'immediate' | 'fallback' | 'manual';

interface PreloadState {
    hasImmediateTriggered: boolean;
    hasFallbackTriggered: boolean;
    currentItemId: string | null;
    preloadTriggerType: PreloadTriggerType | null;
}

type TrackInfo = {
    itemId: string;
    url: string;
    imageUrl?: string;
    backdropUrl?: string;
    crossOrigin?: string | null;
    volume: number;
    muted: boolean;
    normalizationGainDb?: number;
};

interface PreloadOptions {
    itemId: string;
    url: string;
    imageUrl?: string;
    backdropUrl?: string;
    crossOrigin?: string | null;
    volume: number;
    muted: boolean;
    normalizationGainDb?: number;
    timeoutMs?: number;
}

let preloadState: PreloadState = {
    hasImmediateTriggered: false,
    hasFallbackTriggered: false,
    currentItemId: null,
    preloadTriggerType: null
};

export function resetPreloadState(): void {
    preloadState = {
        hasImmediateTriggered: false,
        hasFallbackTriggered: false,
        currentItemId: null,
        preloadTriggerType: null
    };
}

export function getCurrentPreloadState(): PreloadState {
    return { ...preloadState };
}

function shouldPreloadFallback(
    player: { currentTime(): number; duration(): number }
): boolean {
    if (!xDuration.enabled || preloadState.hasFallbackTriggered) {
        return false;
    }

    const fadeOutMs = xDuration.fadeOut * 1000;
    const currentTimeMs = player.currentTime() * 1000;
    const durationMs = player.duration() * 1000;

    const isFiniteDuration = isFinite(durationMs) && durationMs > 0;
    if (!isFiniteDuration) {
        return false;
    }

    const timeRemaining = durationMs - currentTimeMs;
    const fallbackTriggerPoint = fadeOutMs * 3;

    return timeRemaining <= fallbackTriggerPoint;
}

async function executePreload(
    trackInfo: TrackInfo,
    triggerType: PreloadTriggerType
): Promise<boolean> {
    const {
        itemId,
        url,
        imageUrl,
        backdropUrl,
        crossOrigin,
        volume,
        muted,
        normalizationGainDb
    } = trackInfo;

    if (preloadState.currentItemId === itemId) {
        return true;
    }

    const timeoutMs = triggerType === 'fallback' ? 10000 : 15000;

    const result = await preloadNextTrack({
        itemId,
        url,
        crossOrigin,
        volume,
        muted,
        normalizationGainDb,
        timeoutMs
    });

    if (result) {
        preloadState.currentItemId = itemId;
        preloadState.preloadTriggerType = triggerType;

        if (triggerType === 'immediate') {
            preloadState.hasImmediateTriggered = true;
        } else if (triggerType === 'fallback') {
            preloadState.hasFallbackTriggered = true;
        }

        return true;
    }

    return false;
}

export function handlePlaybackTimeUpdate(
    player: { currentTime(): number; duration(): number },
    getNextTrack: () => TrackInfo | null
): void {
    const nextTrack = getNextTrack();
    if (!nextTrack) {
        return;
    }

    if (shouldPreloadFallback(player)) {
        console.debug('[CrossfadePreload] Fallback trigger near crossfade');
        executePreload(nextTrack, 'fallback');
        return;
    }
}

export async function handleManualSkip(
    trackInfo: TrackInfo
): Promise<boolean> {
    console.debug('[CrossfadePreload] Manual trigger on user skip');
    resetPreloadState();
    return await executePreload(trackInfo, 'manual');
}

export function handleTrackStart(currentTrack: TrackInfo, getNextTrack: () => TrackInfo | null): void {
    resetPreloadState();
    console.debug('[CrossfadePreload] State reset for new track:', currentTrack.itemId);

    const nextTrack = getNextTrack();
    if (nextTrack && xDuration.enabled) {
        console.debug('[CrossfadePreload] Immediate preload of next track:', nextTrack.itemId);
        executePreload(nextTrack, 'immediate');
    }
}

export function setCrossfadeDuration(crossfadeDuration: number): void {
    setXDuration(crossfadeDuration);
    resetPreloadState();
}

export function getCrossfadeDuration(): number {
    return userSettings.crossfadeDuration(undefined);
}
