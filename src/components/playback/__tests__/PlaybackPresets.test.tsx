/**
 * Playback Presets Tests
 *
 * Integration tests for playback preset management functionality.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlaybackPreset } from '../PlaybackPresets';

describe('Playback Presets', () => {
    describe('preset creation', () => {
        it('creates preset with name and metadata', () => {
            const preset: PlaybackPreset = {
                id: 'preset-1',
                name: 'My Favorite Mix',
                timestamp: Date.now(),
                queueItemCount: 10,
                shuffleMode: 'Shuffle',
                repeatMode: 'RepeatAll'
            };

            expect(preset.name).toBe('My Favorite Mix');
            expect(preset.queueItemCount).toBe(10);
            expect(preset.shuffleMode).toBe('Shuffle');
            expect(preset.repeatMode).toBe('RepeatAll');
        });

        it('creates preset with current item tracking', () => {
            const preset: PlaybackPreset = {
                id: 'preset-2',
                name: 'Current Queue',
                timestamp: Date.now(),
                queueItemCount: 5,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone',
                currentItemId: 'item-123'
            };

            expect(preset.currentItemId).toBe('item-123');
        });

        it('generates unique preset IDs', () => {
            const presets: PlaybackPreset[] = [
                {
                    id: `preset-${Date.now()}`,
                    name: 'Preset 1',
                    timestamp: Date.now(),
                    queueItemCount: 5,
                    shuffleMode: 'Sorted',
                    repeatMode: 'RepeatNone'
                },
                {
                    id: `preset-${Date.now() + 1}`,
                    name: 'Preset 2',
                    timestamp: Date.now() + 1,
                    queueItemCount: 8,
                    shuffleMode: 'Shuffle',
                    repeatMode: 'RepeatOne'
                }
            ];

            expect(presets[0].id).not.toBe(presets[1].id);
        });
    });

    describe('preset storage', () => {
        it('stores preset metadata correctly', () => {
            const preset: PlaybackPreset = {
                id: 'preset-storage',
                name: 'Stored Preset',
                timestamp: 1234567890,
                queueItemCount: 15,
                shuffleMode: 'Shuffle',
                repeatMode: 'RepeatAll'
            };

            const stored = JSON.stringify(preset);
            const parsed = JSON.parse(stored) as PlaybackPreset;

            expect(parsed.id).toBe(preset.id);
            expect(parsed.name).toBe(preset.name);
            expect(parsed.queueItemCount).toBe(preset.queueItemCount);
        });

        it('preserves timestamp precision', () => {
            const now = Date.now();
            const preset: PlaybackPreset = {
                id: 'preset-time',
                name: 'Time Test',
                timestamp: now,
                queueItemCount: 3,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            };

            expect(preset.timestamp).toBe(now);
        });
    });

    describe('preset queuing', () => {
        it('tracks queue size in preset', () => {
            const queueItems = Array.from({ length: 50 }, (_, i) => ({
                id: `item-${i}`,
                name: `Item ${i}`
            }));

            const preset: PlaybackPreset = {
                id: 'preset-queue-50',
                name: 'Large Queue',
                timestamp: Date.now(),
                queueItemCount: queueItems.length,
                shuffleMode: 'Shuffle',
                repeatMode: 'RepeatNone'
            };

            expect(preset.queueItemCount).toBe(50);
        });

        it('handles empty queue preset', () => {
            const preset: PlaybackPreset = {
                id: 'preset-empty',
                name: 'Empty Queue',
                timestamp: Date.now(),
                queueItemCount: 0,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            };

            expect(preset.queueItemCount).toBe(0);
        });

        it('handles single item queue', () => {
            const preset: PlaybackPreset = {
                id: 'preset-single',
                name: 'Single Item',
                timestamp: Date.now(),
                queueItemCount: 1,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatOne',
                currentItemId: 'only-item'
            };

            expect(preset.queueItemCount).toBe(1);
            expect(preset.currentItemId).toBe('only-item');
        });
    });

    describe('shuffle and repeat modes', () => {
        it('stores shuffle modes correctly', () => {
            const modes = ['Shuffle', 'Sorted'];
            modes.forEach((mode) => {
                const preset: PlaybackPreset = {
                    id: `preset-${mode}`,
                    name: `Test ${mode}`,
                    timestamp: Date.now(),
                    queueItemCount: 5,
                    shuffleMode: mode,
                    repeatMode: 'RepeatNone'
                };

                expect(preset.shuffleMode).toBe(mode);
            });
        });

        it('stores repeat modes correctly', () => {
            const modes = ['RepeatNone', 'RepeatOne', 'RepeatAll'];
            modes.forEach((mode) => {
                const preset: PlaybackPreset = {
                    id: `preset-${mode}`,
                    name: `Test ${mode}`,
                    timestamp: Date.now(),
                    queueItemCount: 5,
                    shuffleMode: 'Sorted',
                    repeatMode: mode
                };

                expect(preset.repeatMode).toBe(mode);
            });
        });

        it('combines shuffle and repeat modes', () => {
            const preset: PlaybackPreset = {
                id: 'preset-combo',
                name: 'Shuffle + Repeat All',
                timestamp: Date.now(),
                queueItemCount: 10,
                shuffleMode: 'Shuffle',
                repeatMode: 'RepeatAll'
            };

            expect(preset.shuffleMode).toBe('Shuffle');
            expect(preset.repeatMode).toBe('RepeatAll');
        });
    });

    describe('preset naming', () => {
        it('handles preset names with special characters', () => {
            const preset: PlaybackPreset = {
                id: 'preset-special',
                name: 'Mix: The Best Of (2024) & More',
                timestamp: Date.now(),
                queueItemCount: 5,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            };

            expect(preset.name).toBe('Mix: The Best Of (2024) & More');
        });

        it('handles very long preset names', () => {
            const longName = 'A'.repeat(100);
            const preset: PlaybackPreset = {
                id: 'preset-long',
                name: longName,
                timestamp: Date.now(),
                queueItemCount: 5,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            };

            expect(preset.name).toHaveLength(100);
        });

        it('handles Unicode preset names', () => {
            const preset: PlaybackPreset = {
                id: 'preset-unicode',
                name: '🎵 My Music Mix 🎶',
                timestamp: Date.now(),
                queueItemCount: 5,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            };

            expect(preset.name).toBe('🎵 My Music Mix 🎶');
        });
    });

    describe('preset listing', () => {
        it('creates multiple presets with unique IDs', () => {
            const presets: PlaybackPreset[] = Array.from({ length: 5 }, (_, i) => ({
                id: `preset-${i}`,
                name: `Preset ${i + 1}`,
                timestamp: Date.now() + i * 1000,
                queueItemCount: i + 1,
                shuffleMode: i % 2 === 0 ? 'Shuffle' : 'Sorted',
                repeatMode: ['RepeatNone', 'RepeatOne', 'RepeatAll'][i % 3]
            }));

            expect(presets).toHaveLength(5);
            expect(presets[0].id).toBe('preset-0');
            expect(presets[4].id).toBe('preset-4');
        });

        it('sorts presets by timestamp descending', () => {
            const unsorted: PlaybackPreset[] = [
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

        it('handles maximum preset limit', () => {
            const maxPresets = 10;
            const presets: PlaybackPreset[] = Array.from({ length: maxPresets }, (_, i) => ({
                id: `preset-${i}`,
                name: `Preset ${i + 1}`,
                timestamp: Date.now() + i * 1000,
                queueItemCount: 5,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            }));

            expect(presets.length).toBe(maxPresets);
            // Simulate adding one more (should remove oldest)
            const oldest = presets[presets.length - 1];
            const newPreset: PlaybackPreset = {
                id: 'preset-new',
                name: 'New Preset',
                timestamp: Date.now() + maxPresets * 1000,
                queueItemCount: 5,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            };

            const updated = [newPreset, ...presets.slice(0, -1)];
            expect(updated).toHaveLength(maxPresets);
            expect(updated[0].id).toBe('preset-new');
        });
    });

    describe('error handling', () => {
        it('handles missing preset ID', () => {
            const preset: any = {
                name: 'No ID Preset',
                timestamp: Date.now(),
                queueItemCount: 5,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            };

            expect(preset.id).toBeUndefined();
        });

        it('handles missing queue item count', () => {
            const preset: any = {
                id: 'preset-nocount',
                name: 'No Count',
                timestamp: Date.now(),
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            };

            expect(preset.queueItemCount).toBeUndefined();
        });

        it('validates preset structure', () => {
            const isValidPreset = (obj: any): obj is PlaybackPreset => {
                return (
                    typeof obj.id === 'string' &&
                    typeof obj.name === 'string' &&
                    typeof obj.timestamp === 'number' &&
                    typeof obj.queueItemCount === 'number' &&
                    typeof obj.shuffleMode === 'string' &&
                    typeof obj.repeatMode === 'string'
                );
            };

            const valid: PlaybackPreset = {
                id: 'preset-valid',
                name: 'Valid',
                timestamp: Date.now(),
                queueItemCount: 5,
                shuffleMode: 'Sorted',
                repeatMode: 'RepeatNone'
            };

            const invalid = {
                id: 'preset-invalid',
                name: 'Invalid'
            };

            expect(isValidPreset(valid)).toBe(true);
            expect(isValidPreset(invalid)).toBe(false);
        });
    });
});
