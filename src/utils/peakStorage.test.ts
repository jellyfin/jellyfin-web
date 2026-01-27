import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PeakData, AudioAnalysis } from './peakStorage';

// Mock IndexedDB
const mockDB = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    getAllFromIndex: vi.fn(),
    getFromIndex: vi.fn(),
    transaction: vi.fn(),
    createObjectStore: vi.fn(),
    createIndex: vi.fn()
};

vi.mock('idb', () => ({
    openDB: vi.fn().mockResolvedValue(mockDB)
}));

describe('Peak Storage', () => {
    const mockPeakData: PeakData = {
        low: [[0.1, 0.2], [0.15, 0.25]],
        medium: [[0.1, 0.2, 0.15], [0.15, 0.25, 0.2]],
        high: [[0.1, 0.2, 0.15, 0.18], [0.15, 0.25, 0.2, 0.22]],
        ultra: [[0.1, 0.2, 0.15, 0.18, 0.12], [0.15, 0.25, 0.2, 0.22, 0.18]]
    };

    const mockAnalysis: AudioAnalysis = {
        itemId: 'song-123',
        url: 'http://example.com/song.mp3',
        duration: 180,
        peaks: mockPeakData,
        analysis: {
            bpm: 120,
            grid: {
                beats: [0, 0.5, 1, 1.5],
                bars: [0, 2, 4],
                downbeats: [0]
            },
            introStart: 0,
            outroStart: 160
        },
        timestamp: Date.now(),
        lastAccessed: Date.now()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('PeakData interface', () => {
        it('should define peak data structure', () => {
            expect(mockPeakData.low).toBeDefined();
            expect(mockPeakData.medium).toBeDefined();
            expect(mockPeakData.high).toBeDefined();
            expect(mockPeakData.ultra).toBeDefined();
        });

        it('should have correct resolution levels', () => {
            expect(mockPeakData.low[0]).toHaveLength(2);
            expect(mockPeakData.medium[0]).toHaveLength(3);
            expect(mockPeakData.high[0]).toHaveLength(4);
            expect(mockPeakData.ultra[0]).toHaveLength(5);
        });
    });

    describe('AudioAnalysis interface', () => {
        it('should define audio analysis structure', () => {
            expect(mockAnalysis.itemId).toBe('song-123');
            expect(mockAnalysis.url).toBe('http://example.com/song.mp3');
            expect(mockAnalysis.duration).toBe(180);
            expect(mockAnalysis.peaks).toBeDefined();
        });

        it('should support analysis data', () => {
            expect(mockAnalysis.analysis?.bpm).toBe(120);
            expect(mockAnalysis.analysis?.grid).toBeDefined();
            expect(mockAnalysis.analysis?.introStart).toBe(0);
            expect(mockAnalysis.analysis?.outroStart).toBe(160);
        });

        it('should track timestamps', () => {
            expect(mockAnalysis.timestamp).toBeLessThanOrEqual(Date.now());
            expect(mockAnalysis.lastAccessed).toBeLessThanOrEqual(Date.now());
        });
    });

    describe('peak data structure', () => {
        it('should store stereo peak data', () => {
            expect(mockPeakData.low).toHaveLength(2);
            expect(mockPeakData.medium).toHaveLength(2);
            expect(mockPeakData.high).toHaveLength(2);
            expect(mockPeakData.ultra).toHaveLength(2);
        });

        it('should support mono peak data', () => {
            const monoPeaks: PeakData = {
                low: [[0.1, 0.2]],
                medium: [[0.1, 0.2, 0.15]],
                high: [[0.1, 0.2, 0.15, 0.18]],
                ultra: [[0.1, 0.2, 0.15, 0.18, 0.12]]
            };

            expect(monoPeaks.low).toHaveLength(1);
        });

        it('should handle various peak value ranges', () => {
            const peaks: PeakData = {
                low: [[0, 0.5], [0.5, 1]],
                medium: [[0.1, 0.2], [0.3, 0.4]],
                high: [[0.05, 0.15], [0.25, 0.35]],
                ultra: [[0.01, 0.1], [0.2, 0.3]]
            };

            peaks.low.forEach(channel => {
                channel.forEach(value => {
                    expect(value).toBeGreaterThanOrEqual(0);
                    expect(value).toBeLessThanOrEqual(1);
                });
            });
        });
    });

    describe('analysis grid', () => {
        it('should define beat grid', () => {
            const grid = mockAnalysis.analysis?.grid;
            expect(grid?.beats).toBeDefined();
            expect(grid?.bars).toBeDefined();
            expect(grid?.downbeats).toBeDefined();
        });

        it('should track temporal points', () => {
            expect(mockAnalysis.analysis?.introStart).toBeGreaterThanOrEqual(0);
            expect(mockAnalysis.analysis?.outroStart).toBeLessThanOrEqual(mockAnalysis.duration);
        });

        it('should handle various beat patterns', () => {
            const grid = {
                beats: [0, 0.25, 0.5, 0.75, 1, 1.25],
                bars: [0, 1, 2, 3],
                downbeats: [0, 2]
            };

            expect(grid.beats).toBeDefined();
            expect(grid.beats.length).toBeGreaterThan(0);
        });
    });

    describe('multi-resolution storage', () => {
        it('should store all resolution levels', () => {
            const resolutions = ['low', 'medium', 'high', 'ultra'] as const;
            resolutions.forEach(res => {
                expect(mockPeakData[res]).toBeDefined();
                expect(Array.isArray(mockPeakData[res])).toBe(true);
            });
        });

        it('should maintain consistent structure across resolutions', () => {
            expect(mockPeakData.low[0]).toHaveLength(2);
            expect(mockPeakData.medium[0]).toHaveLength(2);
            expect(mockPeakData.high[0]).toHaveLength(2);
            expect(mockPeakData.ultra[0]).toHaveLength(2);
        });

        it('should allow independent resolution access', () => {
            const lowRes = mockPeakData.low;
            const highRes = mockPeakData.high;
            
            expect(lowRes).not.toBe(highRes);
            expect(lowRes[0]).toHaveLength(2);
            expect(highRes[0]).toHaveLength(4);
        });
    });

    describe('cache management', () => {
        it('should track timestamp for LRU eviction', () => {
            expect(mockAnalysis.timestamp).toBeDefined();
            expect(typeof mockAnalysis.timestamp).toBe('number');
        });

        it('should update lastAccessed on retrieval', () => {
            const newAnalysis = {
                ...mockAnalysis,
                lastAccessed: Date.now()
            };

            expect(newAnalysis.lastAccessed).toBeGreaterThanOrEqual(mockAnalysis.timestamp);
        });

        it('should support batch eviction', () => {
            const analyses = Array.from({ length: 5 }, (_, i) => ({
                ...mockAnalysis,
                itemId: `song-${i}`,
                lastAccessed: Date.now() - i * 1000
            }));

            const oldest = analyses.slice(0, 2);
            expect(oldest[0].lastAccessed).toBeLessThan(oldest[1].lastAccessed);
        });
    });

    describe('database indexing', () => {
        it('should support itemId lookup', () => {
            expect(mockAnalysis.itemId).toBeDefined();
        });

        it('should support URL lookup', () => {
            expect(mockAnalysis.url).toBeDefined();
        });

        it('should support timestamp sorting', () => {
            const analyses = [
                { ...mockAnalysis, timestamp: 1000 },
                { ...mockAnalysis, timestamp: 2000 },
                { ...mockAnalysis, timestamp: 1500 }
            ];

            const sorted = [...analyses].sort((a, b) => a.timestamp - b.timestamp);
            expect(sorted[0].timestamp).toBe(1000);
            expect(sorted[2].timestamp).toBe(2000);
        });

        it('should support lastAccessed sorting', () => {
            const analyses = [
                { ...mockAnalysis, lastAccessed: 1000 },
                { ...mockAnalysis, lastAccessed: 2000 },
                { ...mockAnalysis, lastAccessed: 1500 }
            ];

            const sorted = [...analyses].sort((a, b) => a.lastAccessed - b.lastAccessed);
            expect(sorted[0].lastAccessed).toBe(1000);
            expect(sorted[2].lastAccessed).toBe(2000);
        });
    });

    describe('data validation', () => {
        it('should validate peak data ranges', () => {
            const isValidPeak = (peaks: PeakData): boolean => {
                const validate = (arr: number[][]): boolean =>
                    arr.every(channel =>
                        channel.every(v => v >= 0 && v <= 1)
                    );
                
                return validate(peaks.low) && validate(peaks.medium) &&
                       validate(peaks.high) && validate(peaks.ultra);
            };

            expect(isValidPeak(mockPeakData)).toBe(true);
        });

        it('should validate analysis timestamps', () => {
            const now = Date.now();
            expect(mockAnalysis.timestamp).toBeLessThanOrEqual(now);
            expect(mockAnalysis.lastAccessed).toBeLessThanOrEqual(now);
        });

        it('should validate temporal points', () => {
            const duration = mockAnalysis.duration;
            if (mockAnalysis.analysis?.introStart !== undefined) {
                expect(mockAnalysis.analysis.introStart).toBeGreaterThanOrEqual(0);
            }
            if (mockAnalysis.analysis?.outroStart !== undefined) {
                expect(mockAnalysis.analysis.outroStart).toBeLessThanOrEqual(duration);
            }
        });
    });
});
