/**
 * Peak Analyzer
 *
 * Extracts peak data from audio tracks for WaveSurfer visualization.
 * Uses invisible WaveSurfer instances to extract peaks without connecting to audio engine.
 * Implements LRU cache for peak data.
 */

import { logger } from './logger';

interface PeakCacheEntry {
    peaks: number[][];
    duration: number;
    timestamp: number;
}

const PEAK_CACHE_MAX_SIZE = 10;
const PEAK_CACHE_KEY_PREFIX = 'peaks:';

const peakCache = new Map<string, PeakCacheEntry>();

function getCacheKey(itemId: string | null, streamUrl: string | null): string | null {
    if (itemId) return `${PEAK_CACHE_KEY_PREFIX}item:${itemId}`;
    if (streamUrl) return `${PEAK_CACHE_KEY_PREFIX}url:${streamUrl}`;
    return null;
}

function getCachedPeaks(itemId: string | null, streamUrl: string | null): PeakCacheEntry | null {
    const key = getCacheKey(itemId, streamUrl);
    if (!key) return null;

    const entry = peakCache.get(key);
    if (entry) {
        entry.timestamp = Date.now();
        return entry;
    }
    return null;
}

function setCachedPeaks(
    itemId: string | null,
    streamUrl: string | null,
    peaks: number[][],
    duration: number
): void {
    const key = getCacheKey(itemId, streamUrl);
    if (!key) return;

    if (peakCache.size >= PEAK_CACHE_MAX_SIZE) {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;
        peakCache.forEach((entry, k) => {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = k;
            }
        });
        if (oldestKey) {
            peakCache.delete(oldestKey);
            logger.debug('[PeakAnalyzer] Evicted oldest cache entry', {
                component: 'PeakAnalyzer',
                key: oldestKey
            });
        }
    }

    peakCache.set(key, { peaks, duration, timestamp: Date.now() });
}

export function clearPeakCache(): void {
    peakCache.clear();
    logger.debug('[PeakAnalyzer] Cleared peak cache', { component: 'PeakAnalyzer' });
}

export function getPeakCacheSize(): number {
    return peakCache.size;
}

export interface PeakAnalysisResult {
    duration: number;
    peaks: number[][];
    fromCache: boolean;
}

export async function extractPeaksForAnalysis(
    itemId: string | null,
    streamUrl: string
): Promise<PeakAnalysisResult | null> {
    if (!streamUrl) {
        logger.warn('[PeakAnalyzer] No stream URL provided', { component: 'PeakAnalyzer' });
        return null;
    }

    const cached = getCachedPeaks(itemId, streamUrl);
    if (cached) {
        logger.debug('[PeakAnalyzer] Using cached peaks', {
            component: 'PeakAnalyzer',
            itemId,
            duration: cached.duration
        });
        return {
            duration: cached.duration,
            peaks: cached.peaks,
            fromCache: true
        };
    }

    logger.debug('[PeakAnalyzer] Extracting peaks', { component: 'PeakAnalyzer', itemId });

    try {
        const container = document.createElement('div');
        container.style.visibility = 'hidden';
        container.style.position = 'absolute';
        container.style.width = '1px';
        container.style.height = '1px';
        container.style.overflow = 'hidden';
        document.body.appendChild(container);

        let wavesurfer: any = null;
        try {
            const WaveSurfer = (await import('wavesurfer.js')).default;

            wavesurfer = WaveSurfer.create({
                container,
                waveColor: 'transparent',
                progressColor: 'transparent',
                cursorWidth: 0,
                interact: false,
                autoplay: false,
                fillParent: true,
                minPxPerSec: 0
            });

            await new Promise<void>((resolve, reject) => {
                wavesurfer.on('ready', resolve);
                wavesurfer.on('error', reject);
                wavesurfer.load(streamUrl);
            });

            await new Promise<void>((resolve) => {
                const checkDecoded = () => {
                    if (wavesurfer.getDecodedData()) {
                        resolve();
                    } else {
                        requestAnimationFrame(checkDecoded);
                    }
                };
                checkDecoded();
            });

            const peaks = wavesurfer.exportPeaks({ channels: 2, samples: 1000 });
            const duration = wavesurfer.getDuration();

            if (peaks && duration > 0) {
                setCachedPeaks(itemId, streamUrl, peaks, duration);

                logger.debug('[PeakAnalyzer] Extracted peaks', {
                    component: 'PeakAnalyzer',
                    itemId,
                    duration,
                    peakCount: peaks[0]?.length || 0
                });

                return {
                    duration,
                    peaks,
                    fromCache: false
                };
            }

            logger.warn('[PeakAnalyzer] Failed to extract peaks - empty data', {
                component: 'PeakAnalyzer',
                itemId
            });
            return null;
        } finally {
            if (wavesurfer) {
                try {
                    wavesurfer.destroy();
                } catch (e) {}
            }
            document.body.removeChild(container);
        }
    } catch (error) {
        logger.warn(
            '[PeakAnalyzer] Failed to extract peaks',
            {
                component: 'PeakAnalyzer',
                itemId
            },
            error as Error
        );
        return null;
    }
}

export async function preloadPeaksForNextTrack(
    currentItemId: string | null,
    currentStreamUrl: string,
    nextItemId: string | null,
    nextStreamUrl: string
): Promise<void> {
    if (!nextStreamUrl) return;

    try {
        await extractPeaksForAnalysis(nextItemId, nextStreamUrl);
    } catch (error) {
        logger.debug('[PeakAnalyzer] Preload skipped', { component: 'PeakAnalyzer', nextItemId });
    }
}

export function hasPeakData(itemId: string | null, streamUrl: string | null): boolean {
    return getCachedPeaks(itemId, streamUrl) !== null;
}

export function getPeakData(
    itemId: string | null,
    streamUrl: string | null
): PeakAnalysisResult | null {
    const cached = getCachedPeaks(itemId, streamUrl);
    if (!cached) return null;

    return {
        duration: cached.duration,
        peaks: cached.peaks,
        fromCache: true
    };
}

export interface PeakAnalysisOptions {
    samples?: number;
    channels?: number;
}

export async function extractPeaksWithOptions(
    itemId: string | null,
    streamUrl: string,
    options: PeakAnalysisOptions = {}
): Promise<PeakAnalysisResult | null> {
    const { samples = 1000, channels = 2 } = options;

    const cached = getCachedPeaks(itemId, streamUrl);
    if (cached) {
        return {
            duration: cached.duration,
            peaks: cached.peaks,
            fromCache: true
        };
    }

    try {
        const container = document.createElement('div');
        container.style.visibility = 'hidden';
        container.style.position = 'absolute';
        container.style.width = '1px';
        container.style.height = '1px';
        container.style.overflow = 'hidden';
        document.body.appendChild(container);

        let wavesurfer: any = null;
        try {
            const WaveSurfer = (await import('wavesurfer.js')).default;

            wavesurfer = WaveSurfer.create({
                container,
                waveColor: 'transparent',
                progressColor: 'transparent',
                cursorWidth: 0,
                interact: false,
                autoplay: false,
                fillParent: true,
                minPxPerSec: 0
            });

            await new Promise<void>((resolve, reject) => {
                wavesurfer.on('ready', resolve);
                wavesurfer.on('error', reject);
                wavesurfer.load(streamUrl);
            });

            const peaks = wavesurfer.exportPeaks({ channels, samples });
            const duration = wavesurfer.getDuration();

            if (peaks && duration > 0) {
                setCachedPeaks(itemId, streamUrl, peaks, duration);
                return { duration, peaks, fromCache: false };
            }

            return null;
        } finally {
            if (wavesurfer) {
                try {
                    wavesurfer.destroy();
                } catch (e) {}
            }
            document.body.removeChild(container);
        }
    } catch (error) {
        logger.warn(
            '[PeakAnalyzer] Extraction failed',
            { component: 'PeakAnalyzer', itemId },
            error as Error
        );
        return null;
    }
}

export function evictOldCacheEntries(maxAgeMs = 3600000): void {
    const now = Date.now();
    let evicted = 0;

    peakCache.forEach((entry, key) => {
        if (now - entry.timestamp > maxAgeMs) {
            peakCache.delete(key);
            evicted++;
        }
    });

    if (evicted > 0) {
        logger.debug('[PeakAnalyzer] Evicted old entries', {
            component: 'PeakAnalyzer',
            count: evicted
        });
    }
}

export function getCacheStats(): { size: number; oldestAge: number; newestAge: number } {
    if (peakCache.size === 0) {
        return { size: 0, oldestAge: 0, newestAge: 0 };
    }

    const now = Date.now();
    let oldestAge = 0;
    let newestAge = 0;

    peakCache.forEach((entry) => {
        const age = now - entry.timestamp;
        if (age > oldestAge) oldestAge = age;
        if (age < newestAge || newestAge === 0) newestAge = age;
    });

    return {
        size: peakCache.size,
        oldestAge,
        newestAge
    };
}
