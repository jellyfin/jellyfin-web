/**
 * NFO Peaks File Handler
 *
 * Reads and writes peak data to companion NFO files.
 * File convention: <mediafilename>.peaks.nfo
 */

import { logger } from 'utils/logger';

import type { PeakData } from './peakStorage';

export function getPeaksNfoUrl(mediaUrl: string): string {
    const url = new URL(mediaUrl, window.location.origin);
    const path = url.pathname;
    const lastDot = path.lastIndexOf('.');
    if (lastDot > 0) {
        url.pathname = path.substring(0, lastDot) + '.peaks.nfo';
    } else {
        url.pathname = path + '.peaks.nfo';
    }
    return url.toString();
}

export async function readPeaksFromNfo(mediaUrl: string): Promise<NfoPeaksData | null> {
    const nfoUrl = getPeaksNfoUrl(mediaUrl);

    try {
        const response = await fetch(nfoUrl, { method: 'HEAD' });
        if (!response.ok) return null;

        const nfoResponse = await fetch(nfoUrl);
        const text = await nfoResponse.text();
        return parseNfoPeaks(text);
    } catch {
        return null;
    }
}

export interface NfoPeaksData {
    itemId: string;
    duration: number;
    peaks: PeakData;
    analysis?: {
        bpm?: number;
        grid?: {
            beats: number[];
            bars: number[];
            downbeats: number[];
        };
        introStart?: number;
        outroStart?: number;
    };
}

function parseOptionalFloat(text: string | undefined): number | undefined {
    if (text === undefined || text === '') return undefined;
    const parsed = parseFloat(text);
    return isNaN(parsed) ? undefined : parsed;
}

function parseTimestampsFromElement(parent: Element, selector: string): number[] {
    const el = parent.querySelector(selector);
    const text = el?.textContent;
    if (text === undefined || text === '') return [];
    return text
        .split(',')
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n));
}

function parseAnalysis(analysisEl: Element): NfoPeaksData['analysis'] {
    const bpmEl = analysisEl.querySelector('bpm');
    const introEl = analysisEl.querySelector('introStart');
    const outroEl = analysisEl.querySelector('outroStart');

    const analysis: NfoPeaksData['analysis'] = {
        bpm: parseOptionalFloat(bpmEl?.textContent),
        introStart: parseOptionalFloat(introEl?.textContent),
        outroStart: parseOptionalFloat(outroEl?.textContent)
    };

    const gridEl = analysisEl.querySelector('grid');
    if (gridEl) {
        analysis.grid = {
            beats: parseTimestampsFromElement(gridEl, 'beats'),
            bars: parseTimestampsFromElement(gridEl, 'bars'),
            downbeats: parseTimestampsFromElement(gridEl, 'downbeats')
        };
    }

    return analysis;
}

function parseResolutions(resolutionsEl: Element, peaks: PeakData): void {
    const resolutionMap: Record<string, keyof PeakData> = {
        low: 'low',
        medium: 'medium',
        high: 'high',
        ultra: 'ultra'
    };

    resolutionsEl.querySelectorAll('low, medium, high, ultra').forEach((resEl) => {
        const tagName = resEl.tagName.toLowerCase();
        const key = resolutionMap[tagName] ?? 'medium';
        peaks[key] = parseChannelData(resEl.textContent ?? '');
    });
}

function parseNfoPeaks(xmlText: string): NfoPeaksData | null {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');

        const peaksEl = doc.querySelector('peaks');
        if (!peaksEl) return null;

        const itemId = peaksEl.querySelector('itemId')?.textContent ?? '';
        const durationStr = peaksEl.querySelector('duration')?.textContent;
        const duration = parseOptionalFloat(durationStr) ?? 0;

        const peaks: PeakData = {
            low: [],
            medium: [],
            high: [],
            ultra: []
        };

        const resolutionsEl = peaksEl.querySelector('resolutions');
        if (resolutionsEl) {
            parseResolutions(resolutionsEl, peaks);
        }

        const analysisEl = peaksEl.querySelector('analysis');
        const analysis = analysisEl ? parseAnalysis(analysisEl) : undefined;

        return { itemId, duration, peaks, analysis };
    } catch (error) {
        logger.error('[NFO] Failed to parse peaks NFO', { component: 'NfoPeaks' }, error as Error);
        return null;
    }
}

function parseChannelData(text: string): number[][] {
    if (text.trim() === '') return [[], []];

    const values = text
        .split(',')
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n));
    const channel1: number[] = [];
    const channel2: number[] = [];

    for (let i = 0; i < values.length; i++) {
        if (i % 2 === 0) {
            channel1.push(values[i]);
        } else {
            channel2.push(values[i]);
        }
    }

    return [channel1, channel2];
}
