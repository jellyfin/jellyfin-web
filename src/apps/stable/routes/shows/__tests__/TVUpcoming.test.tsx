/**
 * TVUpcoming Component Tests
 *
 * Integration tests for upcoming TV episodes with playback functionality.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { toVideoItem, toVideoItems } from 'lib/utils/playbackUtils';
import { describe, expect, it } from 'vitest';

describe('TVUpcoming integration', () => {
    describe('upcoming episode conversion', () => {
        it('converts upcoming episode to video playable format', () => {
            const episode: BaseItemDto = {
                Id: 'upcoming-ep-1',
                Name: 'Series Finale',
                Type: 'Episode',
                ServerId: 'server-1',
                SeriesName: 'Breaking Bad',
                IndexNumber: 16,
                ParentIndexNumber: 5,
                PremiereDate: '2024-02-01'
            };

            const playable = toVideoItem(episode);

            expect(playable.id).toBe('upcoming-ep-1');
            expect(playable.title).toBe('Series Finale');
            expect(playable.mediaType).toBe('Video');
        });

        it('creates queue from upcoming episodes', () => {
            const episodes: BaseItemDto[] = [
                {
                    Id: 'ep-1',
                    Name: 'Episode 1',
                    Type: 'Episode',
                    ServerId: 'server-1',
                    PremiereDate: '2024-02-01'
                },
                {
                    Id: 'ep-2',
                    Name: 'Episode 2',
                    Type: 'Episode',
                    ServerId: 'server-1',
                    PremiereDate: '2024-02-08'
                },
                {
                    Id: 'ep-3',
                    Name: 'Episode 3',
                    Type: 'Episode',
                    ServerId: 'server-1',
                    PremiereDate: '2024-02-15'
                }
            ];

            const queue = toVideoItems(episodes);

            expect(queue).toHaveLength(3);
            queue.forEach((item) => expect(item.mediaType).toBe('Video'));
        });

        it('converts multiple upcoming episodes for grouping by date', () => {
            const episodes: BaseItemDto[] = Array.from({ length: 12 }, (_, i) => ({
                Id: `upcoming-ep-${i}`,
                Name: `Episode ${i + 1}`,
                Type: 'Episode' as const,
                ServerId: 'server-1',
                SeriesName: 'Upcoming Show',
                PremiereDate: new Date(2024, 1, 1 + i).toISOString()
            }));

            const playables = toVideoItems(episodes);

            expect(playables).toHaveLength(12);
            playables.forEach((p) => expect(p.mediaType).toBe('Video'));
        });
    });

    describe('upcoming episode grouping', () => {
        it('handles episodes with premiere date information', () => {
            const episode: BaseItemDto = {
                Id: 'upcoming-1',
                Name: 'New Episode',
                Type: 'Episode',
                ServerId: 'server-1',
                SeriesName: 'Shows',
                PremiereDate: '2024-02-14T20:00:00Z'
            };

            const playable = toVideoItem(episode);

            expect(playable.id).toBe('upcoming-1');
            expect(playable.title).toBe('New Episode');
        });

        it('preserves episode metadata for grouped display', () => {
            const episode: BaseItemDto = {
                Id: 'ep-upcoming',
                Name: 'Season Premiere',
                Type: 'Episode',
                ServerId: 'server-1',
                SeriesName: 'Premium Show',
                ParentIndexNumber: 2,
                IndexNumber: 1,
                EpisodeTitle: 'Part One'
            };

            const playable = toVideoItem(episode);

            expect(playable).toMatchObject({
                id: 'ep-upcoming',
                title: 'Season Premiere',
                mediaType: 'Video'
            });
        });

        it('groups upcoming episodes by premiere date', () => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            const episodes: BaseItemDto[] = [
                {
                    Id: 'ep-1',
                    Name: 'Today',
                    Type: 'Episode' as const,
                    ServerId: 'server-1',
                    PremiereDate: today.toISOString()
                },
                {
                    Id: 'ep-2',
                    Name: 'Tomorrow',
                    Type: 'Episode' as const,
                    ServerId: 'server-1',
                    PremiereDate: tomorrow.toISOString()
                },
                {
                    Id: 'ep-3',
                    Name: 'Next Week',
                    Type: 'Episode' as const,
                    ServerId: 'server-1',
                    PremiereDate: nextWeek.toISOString()
                }
            ];

            const queue = toVideoItems(episodes);

            expect(queue).toHaveLength(3);
            expect(queue[0].id).toBe('ep-1');
            expect(queue[1].id).toBe('ep-2');
            expect(queue[2].id).toBe('ep-3');
        });
    });

    describe('error handling', () => {
        it('handles episodes without episode titles', () => {
            const episode: BaseItemDto = {
                Id: 'ep-no-title',
                Name: 'Episode Name',
                Type: 'Episode',
                ServerId: 'server-1',
                SeriesName: 'Show'
            };

            const playable = toVideoItem(episode);

            expect(playable.id).toBe('ep-no-title');
            expect(playable.title).toBe('Episode Name');
        });

        it('handles empty upcoming list', () => {
            const emptyQueue = toVideoItems([]);
            expect(emptyQueue).toEqual([]);
        });

        it('handles episodes with missing premiere date', () => {
            const episode: BaseItemDto = {
                Id: 'ep-no-date',
                Name: 'Undated Episode',
                Type: 'Episode',
                ServerId: 'server-1',
                SeriesName: 'Show'
            };

            const playable = toVideoItem(episode);

            expect(playable.id).toBe('ep-no-date');
        });

        it('preserves series information for display', () => {
            const episode: BaseItemDto = {
                Id: 'ep-1',
                Name: 'Important Episode',
                Type: 'Episode',
                ServerId: 'server-1',
                SeriesName: 'My Show',
                ParentIndexNumber: 3,
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

    describe('upcoming playback scenarios', () => {
        it('enables playback of single upcoming episode', () => {
            const episode: BaseItemDto = {
                Id: 'upcoming-single',
                Name: 'Next Episode',
                Type: 'Episode',
                ServerId: 'server-1',
                SeriesName: 'Current Show'
            };

            const queue = [toVideoItem(episode)];

            expect(queue).toHaveLength(1);
            expect(queue[0].mediaType).toBe('Video');
        });

        it('handles multiple episodes on same premiere date', () => {
            const premiereDate = '2024-02-14T20:00:00Z';
            const episodes: BaseItemDto[] = [
                {
                    Id: 'ep-1',
                    Name: 'Show 1 Ep',
                    Type: 'Episode' as const,
                    ServerId: 'server-1',
                    SeriesName: 'Show 1',
                    PremiereDate: premiereDate
                },
                {
                    Id: 'ep-2',
                    Name: 'Show 2 Ep',
                    Type: 'Episode' as const,
                    ServerId: 'server-1',
                    SeriesName: 'Show 2',
                    PremiereDate: premiereDate
                },
                {
                    Id: 'ep-3',
                    Name: 'Show 3 Ep',
                    Type: 'Episode' as const,
                    ServerId: 'server-1',
                    SeriesName: 'Show 3',
                    PremiereDate: premiereDate
                }
            ];

            const queue = toVideoItems(episodes);

            expect(queue).toHaveLength(3);
            queue.forEach((item, i) => {
                expect(item.id).toBe(`ep-${i + 1}`);
            });
        });

        it('supports browsing upcoming episodes by date group', () => {
            const episodes = Array.from({ length: 48 }, (_, i) => ({
                Id: `upcoming-${i}`,
                Name: `Episode ${i + 1}`,
                Type: 'Episode' as const,
                ServerId: 'server-1',
                SeriesName: `Show ${Math.floor(i / 4)}`,
                PremiereDate: new Date(2024, 1, 1 + Math.floor(i / 4)).toISOString()
            }));

            const queue = toVideoItems(episodes);

            expect(queue).toHaveLength(48);
            expect(queue[0].id).toBe('upcoming-0');
            expect(queue[47].id).toBe('upcoming-47');
        });
    });
});
