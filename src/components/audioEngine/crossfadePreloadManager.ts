/**
 * Crossfade Preload Manager
 *
 * Manages track preloading for crossfade and peak analysis.
 * Triggers preload based on playback progress and wavesurfer state.
 * Supports streaming (metadata-only) and full preload modes based on queue membership.
 */

import {
    isCrossfadeEnabled,
    isVisualizerEnabled,
    usePreferencesStore
} from '../../store/preferencesStore';
import { useQueueStore } from '../../store/queueStore';
import { imagePreloader } from '../../utils/imagePreloader';
import { logger } from '../../utils/logger';
import { extractPeaksForAnalysis } from '../../utils/peakAnalyzer';
import {
    PreloadPurpose,
    PreloadStrategy,
    preloadNextTrack,
    resetPreloadedTrack
} from './crossfadeController';

type PreloadTriggerType = 'immediate' | 'fallback' | 'manual';

interface PreloadState {
    hasImmediateTriggered: boolean;
    hasFallbackTriggered: boolean;
    currentItemId: string | null;
    preloadTriggerType: PreloadTriggerType | null;
}

export interface TrackInfo {
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

let preloadState: PreloadState = {
    hasImmediateTriggered: false,
    hasFallbackTriggered: false,
    currentItemId: null,
    preloadTriggerType: null
};

function isInQueue(itemId: string): boolean {
    const queueStore = useQueueStore.getState();
    return queueStore.items.some((item) => item.item.id === itemId);
}

function getPreloadStrategy(itemId: string | null): PreloadStrategy {
    if (!itemId) return 'streaming';
    return isInQueue(itemId) ? 'full' : 'streaming';
}

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

function shouldPreloadFallback(player: { currentTime(): number; duration(): number }): boolean {
    const crossfadeEnabled = isCrossfadeEnabled();
    if (!crossfadeEnabled || preloadState.hasFallbackTriggered) {
        return false;
    }

    const crossfadeDuration = usePreferencesStore.getState().crossfade.crossfadeDuration;
    const fadeOutMs = crossfadeDuration * 1000;
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
    triggerType: PreloadTriggerType,
    purpose: PreloadPurpose
): Promise<boolean> {
    const {
        itemId,
        url,
        imageUrl,
        backdropUrl,
        artistLogoUrl,
        discImageUrl,
        crossOrigin,
        volume,
        muted,
        normalizationGainDb
    } = trackInfo;

    if (preloadState.currentItemId === itemId) {
        return true;
    }

    const timeoutMs = triggerType === 'fallback' ? 10000 : 15000;
    const strategy = getPreloadStrategy(itemId);

    const result = await preloadNextTrack({
        itemId,
        url,
        crossOrigin,
        volume,
        muted,
        normalizationGainDb,
        timeoutMs,
        purpose,
        strategy
    });

    if (result) {
        preloadState.currentItemId = itemId;
        preloadState.preloadTriggerType = triggerType;

        if (triggerType === 'immediate') {
            preloadState.hasImmediateTriggered = true;
        } else if (triggerType === 'fallback') {
            preloadState.hasFallbackTriggered = true;
        }

        const shouldPreloadImages = strategy === 'full';
        if (shouldPreloadImages && (imageUrl || backdropUrl || artistLogoUrl || discImageUrl)) {
            const imageUrls = [imageUrl, backdropUrl, artistLogoUrl, discImageUrl].filter(
                Boolean
            ) as string[];
            for (const imgUrl of imageUrls) {
                imagePreloader.preloadImage(imgUrl);
            }
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
        logger.debug('[CrossfadePreload] Fallback trigger near crossfade', {
            component: 'CrossfadePreload'
        });
        executePreload(nextTrack, 'fallback', 'crossfade');
        return;
    }
}

export async function handleManualSkip(trackInfo: TrackInfo): Promise<boolean> {
    logger.debug('[CrossfadePreload] Manual trigger on user skip', {
        component: 'CrossfadePreload'
    });
    resetPreloadState();
    return await executePreload(trackInfo, 'manual', 'crossfade');
}

export async function handleTrackStart(
    currentTrack: TrackInfo,
    getNextTrack: () => TrackInfo | null
): Promise<void> {
    resetPreloadState();
    logger.debug(`[CrossfadePreload] State reset for new track: ${currentTrack.itemId}`, {
        component: 'CrossfadePreload'
    });

    const nextTrack = getNextTrack();
    const crossfadeEnabled = isCrossfadeEnabled();
    const visualizerEnabled = isVisualizerEnabled();

    if (nextTrack && crossfadeEnabled) {
        logger.debug(`[CrossfadePreload] Immediate preload of next track: ${nextTrack.itemId}`, {
            component: 'CrossfadePreload'
        });
        await executePreload(nextTrack, 'immediate', 'crossfade');
    }

    if (nextTrack && visualizerEnabled) {
        const isNextInQueue = isInQueue(nextTrack.itemId);

        if (isNextInQueue) {
            logger.debug(
                `[CrossfadePreload] Peak analysis preload of next track: ${nextTrack.itemId}`,
                {
                    component: 'CrossfadePreload'
                }
            );

            extractPeaksForAnalysis(nextTrack.itemId, nextTrack.url).catch((err: Error) => {
                logger.debug(
                    '[CrossfadePreload] Peak analysis preload failed',
                    { component: 'CrossfadePreload', itemId: nextTrack.itemId },
                    err
                );
            });
        } else {
            logger.debug(
                `[CrossfadePreload] Skipping peak analysis for non-queue track: ${nextTrack.itemId}`,
                {
                    component: 'CrossfadePreload'
                }
            );
        }
    }
}

export function setCrossfadeDuration(duration: number): void {
    usePreferencesStore.getState().setCrossfadeDuration(duration);
    resetPreloadState();
}

export function getCrossfadeDuration(): number {
    return usePreferencesStore.getState().crossfade.crossfadeDuration;
}
