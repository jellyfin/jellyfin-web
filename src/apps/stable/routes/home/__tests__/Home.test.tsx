/**
 * Home View Tests
 *
 * Integration tests for home dashboard with continue watching and recently added playback.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { toVideoItem, toVideoItems } from 'lib/utils/playbackUtils';
import { describe, expect, it } from 'vitest';

describe('Home integration', () => {
    describe('continue watching conversion', () => {
        it('converts resume item to video playable format', () => {
            const item: BaseItemDto = {
                Id: 'resume-movie-1',
                Name: 'Inception',
                Type: 'Movie',
                ServerId: 'server-1',
                UserData: {
                    PlaybackPositionTicks: 3600000000,
                    PlayedPercentage: 50
                },
                RunTimeTicks: 7200000000
            };

            const playable = toVideoItem(item);

            expect(playable.id).toBe('resume-movie-1');
            expect(playable.title).toBe('Inception');
            expect(playable.mediaType).toBe('Video');
            expect(playable.duration).toBe(720);
        });

        it('handles resume items from multiple content types', () => {
            const items: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'show-1', Name: 'Episode', Type: 'Episode', ServerId: 'server-1' }
            ];

            const playables = toVideoItems(items);

            expect(playables).toHaveLength(2);
            playables.forEach((p) => expect(p.mediaType).toBe('Video'));
        });
    });

    describe('recently added conversion', () => {
        it('converts recently added movie to playable format', () => {
            const movie: BaseItemDto = {
                Id: 'recent-movie-1',
                Name: 'Oppenheimer',
                Type: 'Movie',
                ServerId: 'server-1',
                ProductionYear: 2023,
                OfficialRating: 'R'
            };

            const playable = toVideoItem(movie);

            expect(playable.id).toBe('recent-movie-1');
            expect(playable.title).toBe('Oppenheimer');
            expect(playable.year).toBe(2023);
            expect(playable.mediaType).toBe('Video');
        });

        it('converts recently added TV show to playable format', () => {
            const show: BaseItemDto = {
                Id: 'recent-show-1',
                Name: 'The Bear',
                Type: 'Series',
                ServerId: 'server-1',
                ProductionYear: 2022
            };

            const playable = toVideoItem(show);

            expect(playable.id).toBe('recent-show-1');
            expect(playable.title).toBe('The Bear');
            expect(playable.mediaType).toBe('Video');
            expect(playable.year).toBe(2022);
        });

        it('creates queue from recently added items', () => {
            const recentItems: BaseItemDto[] = [
                { Id: 'recent-1', Name: 'Item 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'recent-2', Name: 'Item 2', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'recent-3', Name: 'Item 3', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = toVideoItems(recentItems);

            expect(queue).toHaveLength(3);
            queue.forEach((item) => expect(item.mediaType).toBe('Video'));
        });

        it('supports batch conversion of recently added content', () => {
            const recentItems: BaseItemDto[] = Array.from({ length: 10 }, (_, i) => ({
                Id: `recent-${i}`,
                Name: `New Item ${i + 1}`,
                Type: i % 2 === 0 ? ('Movie' as const) : ('Series' as const),
                ServerId: 'server-1'
            }));

            const playables = toVideoItems(recentItems);

            expect(playables).toHaveLength(10);
            playables.forEach((p, i) => {
                expect(p.id).toBe(`recent-${i}`);
            });
        });
    });

    describe('home sections', () => {
        it('maintains continue watching order', () => {
            const items: BaseItemDto[] = [
                { Id: 'cw-3', Name: 'Item C', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'cw-1', Name: 'Item A', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'cw-2', Name: 'Item B', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = toVideoItems(items);

            expect(queue[0].id).toBe('cw-3');
            expect(queue[1].id).toBe('cw-1');
            expect(queue[2].id).toBe('cw-2');
        });

        it('maintains recently added order in reverse chronological', () => {
            const movies: BaseItemDto[] = [
                {
                    Id: 'movie-1',
                    Name: 'Latest',
                    Type: 'Movie' as const,
                    ServerId: 'server-1',
                    ProductionYear: 2023
                },
                {
                    Id: 'movie-2',
                    Name: 'Middle',
                    Type: 'Movie' as const,
                    ServerId: 'server-1',
                    ProductionYear: 2022
                },
                {
                    Id: 'movie-3',
                    Name: 'Oldest',
                    Type: 'Movie' as const,
                    ServerId: 'server-1',
                    ProductionYear: 2021
                }
            ];

            const queue = toVideoItems(movies);

            expect(queue).toHaveLength(3);
            expect(queue[0].year).toBe(2023);
            expect(queue[1].year).toBe(2022);
            expect(queue[2].year).toBe(2021);
        });

        it('supports paginated recently added display', () => {
            const allMovies = Array.from({ length: 50 }, (_, i) => ({
                Id: `movie-${i}`,
                Name: `Movie ${i}`,
                Type: 'Movie' as const,
                ServerId: 'server-1'
            }));

            const page1 = toVideoItems(allMovies.slice(0, 10));
            const page2 = toVideoItems(allMovies.slice(10, 20));

            expect(page1).toHaveLength(10);
            expect(page2).toHaveLength(10);
            expect(page1[0].id).toBe('movie-0');
            expect(page2[0].id).toBe('movie-10');
        });
    });

    describe('mixed content handling', () => {
        it('handles mixed movies and shows in recently added', () => {
            const mixed: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'show-1', Name: 'Show 1', Type: 'Series', ServerId: 'server-1' },
                { Id: 'movie-2', Name: 'Movie 2', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'show-2', Name: 'Show 2', Type: 'Series', ServerId: 'server-1' }
            ];

            const queue = toVideoItems(mixed);

            expect(queue).toHaveLength(4);
            queue.forEach((item) => expect(item.mediaType).toBe('Video'));
        });

        it('handles mixed content in continue watching', () => {
            const items: BaseItemDto[] = [
                {
                    Id: 'resume-movie',
                    Name: 'Movie',
                    Type: 'Movie',
                    ServerId: 'server-1',
                    UserData: { PlaybackPositionTicks: 1000 }
                },
                {
                    Id: 'resume-episode',
                    Name: 'Episode',
                    Type: 'Episode',
                    ServerId: 'server-1',
                    UserData: { PlaybackPositionTicks: 2000 }
                },
                {
                    Id: 'resume-video',
                    Name: 'Video',
                    Type: 'Video',
                    ServerId: 'server-1',
                    UserData: { PlaybackPositionTicks: 3000 }
                }
            ];

            const queue = toVideoItems(items);

            expect(queue).toHaveLength(3);
            queue.forEach((item) => expect(item.mediaType).toBe('Video'));
        });
    });

    describe('error handling', () => {
        it('handles items with missing optional metadata', () => {
            const item: BaseItemDto = {
                Id: 'item-1',
                Name: 'Minimal Item',
                Type: 'Movie',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(item);

            expect(playable.id).toBe('item-1');
            expect(playable.year).toBeUndefined();
            expect(playable.duration).toBeUndefined();
        });

        it('handles empty continue watching list', () => {
            const emptyQueue = toVideoItems([]);
            expect(emptyQueue).toEqual([]);
        });

        it('handles empty recently added list', () => {
            const emptyQueue = toVideoItems([]);
            expect(emptyQueue).toEqual([]);
        });

        it('preserves item metadata including user data', () => {
            const item: BaseItemDto = {
                Id: 'item-resume',
                Name: 'Resume Item',
                Type: 'Movie',
                ServerId: 'server-1',
                RunTimeTicks: 7200000000,
                UserData: {
                    PlaybackPositionTicks: 3600000000,
                    PlayedPercentage: 50
                }
            };

            const playable = toVideoItem(item);

            expect(playable).toMatchObject({
                id: 'item-resume',
                title: 'Resume Item',
                mediaType: 'Video',
                runtimeTicks: 7200000000
            });
        });

        it('handles items with missing runtime', () => {
            const item: BaseItemDto = {
                Id: 'item-no-runtime',
                Name: 'No Runtime Item',
                Type: 'Movie',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(item);

            expect(playable.duration).toBeUndefined();
            expect(playable.runtimeTicks).toBeUndefined();
        });
    });

    describe('playback scenarios', () => {
        it('enables playback from continue watching', () => {
            const resumeItems = Array.from({ length: 5 }, (_, i) => ({
                Id: `resume-${i}`,
                Name: `Resume Item ${i}`,
                Type: 'Movie' as const,
                ServerId: 'server-1',
                UserData: { PlaybackPositionTicks: 1000 * (i + 1) }
            }));

            const queue = toVideoItems(resumeItems);

            expect(queue).toHaveLength(5);
            queue.forEach((item, index) => {
                expect(item.id).toBe(`resume-${index}`);
            });
        });

        it('enables playback from recently added movies', () => {
            const movies = Array.from({ length: 10 }, (_, i) => ({
                Id: `movie-${i}`,
                Name: `Movie ${i + 1}`,
                Type: 'Movie' as const,
                ServerId: 'server-1',
                ProductionYear: 2024 - i
            }));

            const queue = toVideoItems(movies);

            expect(queue).toHaveLength(10);
            queue.forEach((item, i) => {
                expect(item.year).toBe(2024 - i);
            });
        });

        it('enables playback from recently added shows', () => {
            const shows = Array.from({ length: 10 }, (_, i) => ({
                Id: `show-${i}`,
                Name: `Show ${i + 1}`,
                Type: 'Series' as const,
                ServerId: 'server-1',
                ProductionYear: 2024 - i
            }));

            const queue = toVideoItems(shows);

            expect(queue).toHaveLength(10);
            queue.forEach((item, i) => {
                expect(item.year).toBe(2024 - i);
            });
        });
    });
});
