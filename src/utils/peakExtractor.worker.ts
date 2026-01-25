/**
 * Peak Extractor Web Worker
 *
 * Non-blocking peak extraction from audio data.
 * Supports multi-resolution extraction: low (500), medium (1000), high (2000), ultra (5000) samples.
 */

import type { PeakData } from './peakStorage';

const RESOLUTIONS: Record<keyof PeakData, number> = {
    low: 500,
    medium: 1000,
    high: 2000,
    ultra: 5000
};

export interface ExtractPeaksRequest {
    itemId: string;
    audioData: ArrayBuffer;
    url: string;
}

export interface ExtractPeaksResponse {
    itemId: string;
    peaks: PeakData;
    duration: number;
    error?: string;
}

interface WorkerMessage {
    type: 'extract';
    payload: ExtractPeaksRequest;
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
    if (event.data.type !== 'extract') return;

    const { itemId, audioData, url } = event.data.payload;

    try {
        const audioContext = new OfflineAudioContext(2, audioData.byteLength, 44100);
        const buffer = await audioContext.decodeAudioData(audioData);
        const peaks = extractPeaks(buffer, RESOLUTIONS);

        self.postMessage({
            itemId,
            peaks,
            duration: buffer.duration
        } as ExtractPeaksResponse);
    } catch (error) {
        self.postMessage({
            itemId,
            peaks: { low: [], medium: [], high: [], ultra: [] },
            duration: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        } as ExtractPeaksResponse);
    }
};

function extractPeaks(buffer: AudioBuffer, resolutions: typeof RESOLUTIONS): PeakData {
    const channelData: Float32Array[] = [];

    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channelData.push(buffer.getChannelData(i));
    }

    const peaks: PeakData = {
        low: [],
        medium: [],
        high: [],
        ultra: []
    };

    for (const [resolutionKey, numSamples] of Object.entries(resolutions)) {
        const key = resolutionNameToKey(resolutionKey);
        peaks[key] = extractPeaksAtResolution(channelData, numSamples);
    }

    return peaks;
}

function extractPeaksAtResolution(channelData: Float32Array[], numSamples: number): number[][] {
    const peaksPerChannel: number[][] = [];
    const totalSamples = channelData[0].length;
    const samplesPerPeak = Math.ceil(totalSamples / numSamples);

    for (const channel of channelData) {
        const channelPeaks: number[] = [];

        for (let i = 0; i < numSamples; i++) {
            const startSample = Math.floor(i * samplesPerPeak);
            const endSample = Math.min(Math.floor((i + 1) * samplesPerPeak), totalSamples);

            let maxAmp = 0;
            for (let j = startSample; j < endSample; j++) {
                const absAmp = Math.abs(channel[j]);
                if (absAmp > maxAmp) {
                    maxAmp = absAmp;
                }
            }

            channelPeaks.push(maxAmp);
        }

        peaksPerChannel.push(channelPeaks);
    }

    return peaksPerChannel;
}

function resolutionNameToKey(name: string): keyof PeakData {
    const map: Record<string, keyof PeakData> = {
        low: 'low',
        medium: 'medium',
        high: 'high',
        ultra: 'ultra'
    };
    return map[name] || 'medium';
}

export type { WorkerMessage };
