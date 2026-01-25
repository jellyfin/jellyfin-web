/**
 * Peak Storage - IndexedDB + NFO Caching for Audio Analysis
 *
 * Provides persistent storage for:
 * - Multi-resolution waveform peaks (500/1000/2000/5000 samples)
 * - Audio analysis data (BPM, beat grid, intro/outro points)
 * - LRU eviction when cache exceeds 400 tracks
 *
 * NFO file format: <mediafilename>.peaks.nfo
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface PeakData {
    low: number[][]; // 500 samples
    medium: number[][]; // 1000 samples
    high: number[][]; // 2000 samples
    ultra: number[][]; // 5000 samples
}

export interface AudioAnalysis {
    itemId: string;
    url: string;
    duration: number;
    peaks: PeakData;
    // Analysis data (future implementation)
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
    timestamp: number;
    lastAccessed: number;
}

interface AudioAnalysisDB extends DBSchema {
    songs: {
        key: string;
        value: AudioAnalysis;
        indexes: {
            'by-url': string;
            'by-timestamp': number;
            'by-last-accessed': number;
        };
    };
}

const DB_NAME = 'jellyfin-audio-analysis';
const MAX_SONGS = 400;

let dbPromise: Promise<IDBPDatabase<AudioAnalysisDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AudioAnalysisDB>> {
    if (!dbPromise) {
        dbPromise = openDB<AudioAnalysisDB>(DB_NAME, 1, {
            upgrade(db) {
                const store = db.createObjectStore('songs', { keyPath: 'itemId' });
                store.createIndex('by-url', 'url');
                store.createIndex('by-timestamp', 'timestamp');
                store.createIndex('by-last-accessed', 'lastAccessed');
            }
        });
    }
    return dbPromise;
}

async function evictOldest(): Promise<void> {
    const db = await getDB();
    const all = await db.getAllFromIndex('songs', 'by-last-accessed');
    if (all.length >= MAX_SONGS) {
        const toRemove = all.slice(0, all.length - MAX_SONGS + 10);
        const tx = db.transaction('songs', 'readwrite');
        await Promise.all(toRemove.map(song => tx.store.delete(song.itemId)));
        await tx.done;
    }
}

export async function saveSongAnalysis(analysis: AudioAnalysis): Promise<void> {
    const db = await getDB();
    await evictOldest();
    await db.put('songs', {
        ...analysis,
        lastAccessed: Date.now()
    });
}

export async function getSongAnalysis(itemId: string): Promise<AudioAnalysis | undefined> {
    const db = await getDB();
    const song = await db.get('songs', itemId);
    if (song) {
        await db.put('songs', { ...song, lastAccessed: Date.now() });
    }
    return song;
}

export async function getSongAnalysisByUrl(url: string): Promise<AudioAnalysis | undefined> {
    const db = await getDB();
    return db.getFromIndex('songs', 'by-url', url);
}

export function getPeakResolution(peaks: PeakData, zoomLevel: number): number[][] {
    if (zoomLevel < 50) return peaks.low;
    if (zoomLevel < 200) return peaks.medium;
    if (zoomLevel < 1000) return peaks.high;
    return peaks.ultra;
}

export async function deleteSongAnalysis(itemId: string): Promise<void> {
    const db = await getDB();
    await db.delete('songs', itemId);
}

export async function clearAllAnalysis(): Promise<void> {
    const db = await getDB();
    await db.clear('songs');
}

export async function getCacheStats(): Promise<{ count: number; oldest: number | null; newest: number | null }> {
    const db = await getDB();
    const all = await db.getAllFromIndex('songs', 'by-timestamp');
    return {
        count: all.length,
        oldest: all.length > 0 ? all[0].timestamp : null,
        newest: all.length > 0 ? all[all.length - 1].timestamp : null
    };
}
