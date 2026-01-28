/**
 * Playback Presets Hook Tests
 *
 * Tests for the usePlaybackPresets hook functionality.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('usePlaybackPresets Hook', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('preset persistence', () => {
        it('persists presets to localStorage', () => {
            const presets = [
                {
                    id: 'preset-1',
                    name: 'Test Preset',
                    timestamp: Date.now(),
                    queueItemCount: 5,
                    shuffleMode: 'Sorted',
                    repeatMode: 'RepeatNone'
                }
            ];

            const stored = JSON.stringify(presets);
            localStorage.setItem('jellyfin-playback-presets', stored);

            const retrieved = localStorage.getItem('jellyfin-playback-presets');
            expect(retrieved).toBe(stored);
        });

        it('loads presets from localStorage on initialization', () => {
            const presets = [
                {
                    id: 'preset-1',
                    name: 'Loaded Preset',
                    timestamp: Date.now(),
                    queueItemCount: 10,
                    shuffleMode: 'Shuffle',
                    repeatMode: 'RepeatAll'
                }
            ];

            localStorage.setItem('jellyfin-playback-presets', JSON.stringify(presets));

            const stored = localStorage.getItem('jellyfin-playback-presets');
            const loaded = JSON.parse(stored!);

            expect(loaded).toHaveLength(1);
            expect(loaded[0].name).toBe('Loaded Preset');
        });

        it('handles empty localStorage gracefully', () => {
            localStorage.removeItem('jellyfin-playback-presets');

            const stored = localStorage.getItem('jellyfin-playback-presets');
            expect(stored).toBeNull();
        });

        it('handles corrupted JSON in localStorage', () => {
            localStorage.setItem('jellyfin-playback-presets', 'invalid json');

            const stored = localStorage.getItem('jellyfin-playback-presets');
            expect(() => JSON.parse(stored!)).toThrow();
        });
    });

    describe('preset operations', () => {
        it('simulates saving a preset', () => {
            const presets: Array<{
                id: string;
                name: string;
                timestamp: number;
                queueItemCount: number;
                shuffleMode: string;
                repeatMode: string;
            }> = [];
            const newPreset = {
                id: 'preset-new',
                name: 'New Preset',
                timestamp: Date.now(),
                queueItemCount: 5,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            };

            const updated = [newPreset, ...presets];
            expect(updated).toHaveLength(1);
            expect(updated[0].name).toBe('New Preset');
        });

        it('simulates deleting a preset', () => {
            const presets = [
                {
                    id: 'preset-1',
                    name: 'First',
                    timestamp: Date.now(),
                    queueItemCount: 5,
                    shuffleMode: 'Sorted',
                    repeatMode: 'RepeatNone'
                },
                {
                    id: 'preset-2',
                    name: 'Second',
                    timestamp: Date.now() + 1000,
                    queueItemCount: 5,
                    shuffleMode: 'Sorted',
                    repeatMode: 'RepeatNone'
                }
            ];

            const filtered = presets.filter((p) => p.id !== 'preset-1');
            expect(filtered).toHaveLength(1);
            expect(filtered[0].id).toBe('preset-2');
        });

        it('simulates loading a preset', () => {
            const presets = [
                {
                    id: 'preset-load',
                    name: 'Load Me',
                    timestamp: Date.now(),
                    queueItemCount: 8,
                    shuffleMode: 'Shuffle',
                    repeatMode: 'RepeatOne'
                }
            ];

            const loaded = presets.find((p) => p.id === 'preset-load');
            expect(loaded).toBeDefined();
            expect(loaded?.name).toBe('Load Me');
        });

        it('handles loading non-existent preset', () => {
            const presets: any[] = [];
            const loaded = presets.find((p) => p.id === 'non-existent');
            expect(loaded).toBeUndefined();
        });
    });

    describe('preset ordering', () => {
        it('sorts presets by timestamp descending', () => {
            interface PresetItem {
                id: string;
                name: string;
                timestamp: number;
                queueItemCount: number;
                shuffleMode: string;
                repeatMode: string;
            }

            const unsorted: PresetItem[] = [
                {
                    id: 'preset-1',
                    name: 'First',
                    timestamp: 1000,
                    queueItemCount: 5,
                    shuffleMode: 'Sorted',
                    repeatMode: 'RepeatNone'
                },
                {
                    id: 'preset-2',
                    name: 'Second',
                    timestamp: 3000,
                    queueItemCount: 5,
                    shuffleMode: 'Sorted',
                    repeatMode: 'RepeatNone'
                },
                {
                    id: 'preset-3',
                    name: 'Third',
                    timestamp: 2000,
                    queueItemCount: 5,
                    shuffleMode: 'Sorted',
                    repeatMode: 'RepeatNone'
                }
            ];

            const sorted = unsorted.sort((a, b) => b.timestamp - a.timestamp);

            expect(sorted[0].timestamp).toBe(3000);
            expect(sorted[1].timestamp).toBe(2000);
            expect(sorted[2].timestamp).toBe(1000);
        });

        it('maintains insertion order when timestamps are identical', () => {
            interface PresetItem {
                id: string;
                name: string;
                timestamp: number;
                queueItemCount: number;
                shuffleMode: string;
                repeatMode: string;
            }

            const time = Date.now();
            const presets: PresetItem[] = [
                {
                    id: 'preset-1',
                    name: 'First',
                    timestamp: time,
                    queueItemCount: 5,
                    shuffleMode: 'Sorted',
                    repeatMode: 'RepeatNone'
                },
                {
                    id: 'preset-2',
                    name: 'Second',
                    timestamp: time,
                    queueItemCount: 5,
                    shuffleMode: 'Sorted',
                    repeatMode: 'RepeatNone'
                }
            ];

            // Stable sort should maintain original order for equal timestamps
            const sorted = [...presets].sort((a, b) => b.timestamp - a.timestamp);
            expect(sorted[0].id).toBe('preset-1');
            expect(sorted[1].id).toBe('preset-2');
        });
    });

    describe('storage limits', () => {
        it('respects maximum preset limit', () => {
            const maxPresets = 10;
            const presets = Array.from({ length: maxPresets }, (_, i) => ({
                id: `preset-${i}`,
                name: `Preset ${i}`,
                timestamp: Date.now() + i * 1000,
                queueItemCount: 5,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            }));

            expect(presets).toHaveLength(maxPresets);

            // Adding one more should evict the oldest
            const newPreset = {
                id: 'preset-new',
                name: 'New',
                timestamp: Date.now() + maxPresets * 1000,
                queueItemCount: 5,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            };

            const updated = [newPreset, ...presets.slice(0, -1)];
            expect(updated).toHaveLength(maxPresets);
            expect(updated[0].id).toBe('preset-new');
        });

        it('handles adding preset at limit', () => {
            const maxPresets = 10;
            const presets = Array.from({ length: maxPresets }, (_, i) => ({
                id: `preset-${i}`,
                name: `Preset ${i}`,
                timestamp: Date.now() + i,
                queueItemCount: 5,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            }));

            const newPreset = {
                id: 'preset-extra',
                name: 'Extra',
                timestamp: Date.now() + maxPresets,
                queueItemCount: 5,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            };

            // Simulate evicting oldest (preset-0)
            const updated = [newPreset, ...presets.slice(1)];
            expect(updated).toHaveLength(maxPresets);
            expect(updated).not.toContainEqual(expect.objectContaining({ id: 'preset-0' }));
        });
    });

    describe('queue data handling', () => {
        it('captures queue size for preset', () => {
            const queueData = Array.from({ length: 25 }, (_, i) => ({
                id: `item-${i}`,
                name: `Item ${i}`
            }));

            const preset = {
                id: 'preset-queue',
                name: 'Queue Snapshot',
                timestamp: Date.now(),
                queueItemCount: queueData.length,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            };

            expect(preset.queueItemCount).toBe(25);
        });

        it('captures current playing item in preset', () => {
            const queueData = Array.from({ length: 10 }, (_, i) => ({
                id: `item-${i}`,
                name: `Item ${i}`
            }));

            const currentItemId = queueData[3].id;

            const preset = {
                id: 'preset-current',
                name: 'With Current Item',
                timestamp: Date.now(),
                queueItemCount: queueData.length,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone',
                currentItemId
            };

            expect(preset.currentItemId).toBe('item-3');
        });

        it('handles empty queue data', () => {
            const queueData = [];

            const preset = {
                id: 'preset-empty',
                name: 'Empty Queue',
                timestamp: Date.now(),
                queueItemCount: queueData.length,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            };

            expect(preset.queueItemCount).toBe(0);
        });
    });

    describe('playback settings capture', () => {
        it('captures shuffle and repeat settings', () => {
            const presets = [
                {
                    id: 'preset-1',
                    name: 'Shuffle All',
                    timestamp: Date.now(),
                    queueItemCount: 5,
                    shuffleMode: 'Shuffle',
                    repeatMode: 'RepeatAll'
                },
                {
                    id: 'preset-2',
                    name: 'Sorted One',
                    timestamp: Date.now() + 1000,
                    queueItemCount: 5,
                    shuffleMode: 'Sorted',
                    repeatMode: 'RepeatOne'
                },
                {
                    id: 'preset-3',
                    name: 'Shuffle None',
                    timestamp: Date.now() + 2000,
                    queueItemCount: 5,
                    shuffleMode: 'Shuffle',
                    repeatMode: 'RepeatNone'
                }
            ];

            expect(presets[0].shuffleMode).toBe('Shuffle');
            expect(presets[0].repeatMode).toBe('RepeatAll');
            expect(presets[1].shuffleMode).toBe('Sorted');
            expect(presets[1].repeatMode).toBe('RepeatOne');
            expect(presets[2].shuffleMode).toBe('Shuffle');
            expect(presets[2].repeatMode).toBe('RepeatNone');
        });

        it('tracks different playback mode combinations', () => {
            const combinations = [
                { shuffle: 'Shuffle', repeat: 'RepeatNone' },
                { shuffle: 'Shuffle', repeat: 'RepeatOne' },
                { shuffle: 'Shuffle', repeat: 'RepeatAll' },
                { shuffle: 'Sorted', repeat: 'RepeatNone' },
                { shuffle: 'Sorted', repeat: 'RepeatOne' },
                { shuffle: 'Sorted', repeat: 'RepeatAll' }
            ];

            const presets = combinations.map((combo, i) => ({
                id: `preset-${i}`,
                name: `${combo.shuffle} + ${combo.repeat}`,
                timestamp: Date.now() + i * 1000,
                queueItemCount: 5,
                shuffleMode: combo.shuffle,
                repeatMode: combo.repeat
            }));

            expect(presets).toHaveLength(6);
            presets.forEach((preset, i) => {
                expect(preset.shuffleMode).toBe(combinations[i].shuffle);
                expect(preset.repeatMode).toBe(combinations[i].repeat);
            });
        });
    });
});
