/**
 * Peak Extraction Service
 *
 * Orchestrates peak extraction using Web Worker + IndexedDB caching + NFO fallback.
 */

import { logger } from 'utils/logger';

import { readPeaksFromNfo } from './nfoPeaks';
import type { ExtractPeaksRequest, ExtractPeaksResponse } from './peakExtractor.worker';
import { getSongAnalysis, type PeakData, saveSongAnalysis } from './peakStorage';

const WORKER_PATH = '/src/utils/peakExtractor.worker.ts';

let worker: Worker | null = null;
const pendingRequests: Map<
    string,
    { resolve: (value: PeakData) => void; reject: (error: Error) => void }
> = new Map();

function getWorker(): Worker {
    if (!worker) {
        worker = new Worker(WORKER_PATH);
        worker.onmessage = (event: MessageEvent<ExtractPeaksResponse>) => {
            const { itemId, peaks, error } = event.data;
            const pending = pendingRequests.get(itemId);
            if (pending) {
                if (error !== undefined && error !== '') {
                    pending.reject(new Error(error));
                } else {
                    pending.resolve(peaks);
                }
                pendingRequests.delete(itemId);
            }
        };
    }
    return worker;
}

export interface ExtractPeaksOptions {
    itemId: string;
    url: string;
    forceRefresh?: boolean;
}

export async function extractPeaksForTrack(options: ExtractPeaksOptions): Promise<PeakData> {
    const { itemId, url, forceRefresh = false } = options;

    if (!forceRefresh) {
        const cached = await getSongAnalysis(itemId);
        if (cached?.peaks) {
            return cached.peaks;
        }

        const byUrl = await getSongAnalysisByUrl(url);
        if (byUrl?.peaks) {
            return byUrl.peaks;
        }
    }

    const nfoData = await readPeaksFromNfo(url);
    if (nfoData?.peaks) {
        await saveSongAnalysis({
            itemId,
            url,
            duration: nfoData.duration,
            peaks: nfoData.peaks,
            analysis: nfoData.analysis,
            timestamp: Date.now(),
            lastAccessed: Date.now()
        });
        return nfoData.peaks;
    }

    const request: ExtractPeaksRequest = { itemId, audioData: new ArrayBuffer(0), url };

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.status}`);
        }
        request.audioData = await response.arrayBuffer();
    } catch (error) {
        throw new Error(`Failed to fetch audio for peaks: ${error}`);
    }

    return new Promise((resolve, reject) => {
        const workerInstance = getWorker();
        pendingRequests.set(itemId, {
            resolve: (peaks) => {
                saveSongAnalysis({
                    itemId,
                    url,
                    duration: 0,
                    peaks,
                    timestamp: Date.now(),
                    lastAccessed: Date.now()
                }).catch((error) =>
                    logger.error(
                        'Failed to save song analysis',
                        { component: 'PeakExtraction' },
                        error
                    )
                );
                resolve(peaks);
            },
            reject
        });
        workerInstance.postMessage({ type: 'extract', payload: request } as {
            type: string;
            payload: ExtractPeaksRequest;
        });
    });
}

export async function getSongAnalysisByUrl(url: string) {
    const { getSongAnalysisByUrl: getByUrl } = await import('./peakStorage');
    return getByUrl(url);
}

export { getPeakResolution } from './peakStorage';
