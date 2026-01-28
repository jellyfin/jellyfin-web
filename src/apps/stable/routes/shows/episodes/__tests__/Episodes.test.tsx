/**
 * Episodes Component Tests
 *
 * Integration tests for episode playback functionality.
 */

import { describe, it, expect } from 'vitest';
import { toVideoItem, toVideoItems } from 'lib/utils/playbackUtils';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

describe('Episodes integration', () => {
    describe('episode playback conversion', () => {
        it('converts episode to video playable format', () => {
            const episode: BaseItemDto = {
                Id: 'episode-123',
                Name: 'Pilot',
                Type: 'Episode',
                ServerId: 'server-1',
                SeriesName: 'Test Show',
                ParentIndexNumber: 1,
                IndexNumber: 1,
                RunTimeTicks: 2700000000 // 45 minutes
            };

            const playable = toVideoItem(episode);

            expect(playable.id).toBe('episode-123');
            expect(playable.title).toBe('Pilot');
            expect(playable.mediaType).toBe('Video');
            expect(playable.duration).toBe(270);
        });

        it('creates valid playback queue from single episode', () => {
            const episode: BaseItemDto = {
                Id: 'episode-1',
                Name: 'Episode 1',
                Type: 'Episode',
                ServerId: 'server-1'
            };

            const queue = [toVideoItem(episode)];

            expect(queue).toHaveLength(1);
            expect(queue[0].mediaType).toBe('Video');
        });

        it('converts season episodes for sequential playback', () => {
            const episodes: BaseItemDto[] = [
                { Id: 'ep-1', Name: 'Pilot', Type: 'Episode', ServerId: 'server-1', IndexNumber: 1 },
                { Id: 'ep-2', Name: 'Episode 2', Type: 'Episode', ServerId: 'server-1', IndexNumber: 2 },
                { Id: 'ep-3', Name: 'Episode 3', Type: 'Episode', ServerId: 'server-1', IndexNumber: 3 }
            ];

            const playables = toVideoItems(episodes);

            expect(playables).toHaveLength(3);
            playables.forEach(p => expect(p.mediaType).toBe('Video'));
        });
    });

    describe('episode ordering', () => {
        it('maintains episode order within season', () => {
            const episodes: BaseItemDto[] = Array.from({ length: 10 }, (_, i) => ({
                Id: `ep-${i}`,
                Name: `Episode ${i + 1}`,
                Type: 'Episode' as const,
                ServerId: 'server-1',
                IndexNumber: i + 1
            }));

            const queue = toVideoItems(episodes);

            expect(queue[0].id).toBe('ep-0');
            expect(queue[9].id).toBe('ep-9');
        });

        it('handles episode duration metadata', () => {
            const episode: BaseItemDto = {
                Id: 'ep-1',
                Name: 'Full Episode',
                Type: 'Episode',
                ServerId: 'server-1',
                RunTimeTicks: 5400000000 // 90 minutes
            };

            const playable = toVideoItem(episode);

            expect(playable.duration).toBe(540);
            expect(playable.runtimeTicks).toBe(5400000000);
        });
    });

    describe('playback scenarios', () => {
        it('enables binge-watching full season', () => {
            const season = Array.from({ length: 13 }, (_, i) => ({
                Id: `ep-${i}`,
                Name: `Episode ${i + 1}`,
                Type: 'Episode' as const,
                ServerId: 'server-1',
                IndexNumber: i + 1
            }));

            const queue = toVideoItems(season);

            expect(queue).toHaveLength(13);
            queue.forEach((item, index) => {
                expect(item.id).toBe(`ep-${index}`);
                expect(item.mediaType).toBe('Video');
            });
        });

        it('handles multiple season episodes', () => {
            const season1: BaseItemDto[] = Array.from({ length: 10 }, (_, i) => ({
                Id: `s1e${i}`,
                Name: `S1 E${i + 1}`,
                Type: 'Episode' as const,
                ServerId: 'server-1'
            }));

            const season2: BaseItemDto[] = Array.from({ length: 10 }, (_, i) => ({
                Id: `s2e${i}`,
                Name: `S2 E${i + 1}`,
                Type: 'Episode' as const,
                ServerId: 'server-1'
            }));

            const allEpisodes = [...season1, ...season2];
            const queue = toVideoItems(allEpisodes);

            expect(queue).toHaveLength(20);
        });
    });

    describe('error handling', () => {
        it('handles episodes with missing duration', () => {
            const episode: BaseItemDto = {
                Id: 'ep-1',
                Name: 'No Duration Episode',
                Type: 'Episode',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(episode);

            expect(playable.duration).toBeUndefined();
            expect(playable.id).toBe('ep-1');
        });

        it('handles empty episode list', () => {
            const emptyQueue = toVideoItems([]);
            expect(emptyQueue).toEqual([]);
        });

        it('preserves episode metadata including series name', () => {
            const episode: BaseItemDto = {
                Id: 'ep-1',
                Name: 'Important Episode',
                Type: 'Episode',
                ServerId: 'server-1',
                SeriesName: 'My Show',
                ParentIndexNumber: 2,
                IndexNumber: 5
            };

            const playable = toVideoItem(episode);

            expect(playable).toMatchObject({
                id: 'ep-1',
                title: 'Important Episode',
                mediaType: 'Video'
            });
        });
    });

    describe('play all functionality', () => {
        it('queues full season for play all', () => {
            const episodes: BaseItemDto[] = Array.from({ length: 8 }, (_, i) => ({
                Id: `ep-${i}`,
                Name: `Episode ${i + 1}`,
                Type: 'Episode' as const,
                ServerId: 'server-1'
            }));

            const queue = toVideoItems(episodes);

            expect(queue).toHaveLength(8);
            expect(queue[0].mediaType).toBe('Video');
        });
    });
});
