/**
 * MoviesRecommended Component Tests
 *
 * Integration tests for movie playback functionality in the recommended view.
 */

import { describe, it, expect } from 'vitest';
import { toVideoItem, toVideoItems } from 'lib/utils/playbackUtils';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

describe('MoviesRecommended integration', () => {
    describe('movie playback conversion', () => {
        it('converts movie to video playable format', () => {
            const movie: BaseItemDto = {
                Id: 'movie-123',
                Name: 'Test Movie',
                Type: 'Movie',
                ServerId: 'server-1',
                ProductionYear: 2024,
                RunTimeTicks: 7200000000 // 2 hours
            };

            const playable = toVideoItem(movie);

            expect(playable.id).toBe('movie-123');
            expect(playable.title).toBe('Test Movie');
            expect(playable.mediaType).toBe('Video');
            expect(playable.duration).toBe(720);
            expect(playable.year).toBe(2024);
        });

        it('creates valid playback queue from single movie', () => {
            const movie: BaseItemDto = {
                Id: 'movie-1',
                Name: 'Single Movie',
                Type: 'Movie',
                ServerId: 'server-1'
            };

            const queue = [toVideoItem(movie)];

            expect(queue).toHaveLength(1);
            expect(queue[0].mediaType).toBe('Video');
            expect(queue[0].id).toBe('movie-1');
        });

        it('converts multiple movies for playlist-like recommendations', () => {
            const movies: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'movie-2', Name: 'Movie 2', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'movie-3', Name: 'Movie 3', Type: 'Movie', ServerId: 'server-1' }
            ];

            const playables = toVideoItems(movies);

            expect(playables).toHaveLength(3);
            playables.forEach(playable => {
                expect(playable.mediaType).toBe('Video');
            });
        });
    });

    describe('recommendations sections', () => {
        it('handles continue watching slice', () => {
            const movies = Array.from({ length: 20 }, (_, i) => ({
                Id: `movie-${i}`,
                Name: `Movie ${i}`,
                Type: 'Movie' as const,
                ServerId: 'server-1'
            }));

            const continueWatching = toVideoItems(movies.slice(0, 6));

            expect(continueWatching).toHaveLength(6);
        });

        it('handles latest additions slice', () => {
            const movies = Array.from({ length: 20 }, (_, i) => ({
                Id: `movie-${i}`,
                Name: `Movie ${i}`,
                Type: 'Movie' as const,
                ServerId: 'server-1'
            }));

            const latestAdditions = toVideoItems(movies.slice(6, 12));

            expect(latestAdditions).toHaveLength(6);
        });

        it('handles suggestions slice', () => {
            const movies = Array.from({ length: 20 }, (_, i) => ({
                Id: `movie-${i}`,
                Name: `Movie ${i}`,
                Type: 'Movie' as const,
                ServerId: 'server-1'
            }));

            const suggestions = toVideoItems(movies.slice(12, 18));

            expect(suggestions).toHaveLength(6);
        });
    });

    describe('playback queue scenarios', () => {
        it('maintains movie order in recommendations', () => {
            const movies: BaseItemDto[] = [
                { Id: 'movie-3', Name: 'Third Movie', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'movie-1', Name: 'First Movie', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'movie-2', Name: 'Second Movie', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = toVideoItems(movies);

            expect(queue[0].id).toBe('movie-3');
            expect(queue[1].id).toBe('movie-1');
            expect(queue[2].id).toBe('movie-2');
        });

        it('handles empty recommendations section', () => {
            const emptyQueue = toVideoItems([]);
            expect(emptyQueue).toEqual([]);
        });

        it('preserves movie metadata in recommendations', () => {
            const movie: BaseItemDto = {
                Id: 'movie-1',
                Name: 'Blockbuster',
                Type: 'Movie',
                ServerId: 'server-1',
                ProductionYear: 2023,
                OfficialRating: 'PG-13',
                RunTimeTicks: 5400000000 // 90 minutes
            };

            const playable = toVideoItem(movie);

            expect(playable).toMatchObject({
                id: 'movie-1',
                title: 'Blockbuster',
                year: 2023,
                duration: 540,
                mediaType: 'Video'
            });
        });
    });

    describe('pagination scenarios', () => {
        it('converts movies for paginated view', () => {
            const allMovies = Array.from({ length: 50 }, (_, i) => ({
                Id: `movie-${i}`,
                Name: `Movie ${i}`,
                Type: 'Movie' as const,
                ServerId: 'server-1'
            }));

            const page1 = toVideoItems(allMovies.slice(0, 18));
            const page2 = toVideoItems(allMovies.slice(18, 36));

            expect(page1).toHaveLength(18);
            expect(page2).toHaveLength(18);
            expect(page1[0].id).toBe('movie-0');
            expect(page2[0].id).toBe('movie-18');
        });
    });

    describe('error handling', () => {
        it('handles movies with missing optional fields', () => {
            const minimalMovie: BaseItemDto = {
                Id: 'movie-1',
                Name: 'Minimal Movie',
                Type: 'Movie',
                ServerId: 'server-1'
                // No production year, rating, or runtime
            };

            const playable = toVideoItem(minimalMovie);

            expect(playable.id).toBe('movie-1');
            expect(playable.title).toBe('Minimal Movie');
            expect(playable.duration).toBeUndefined();
            expect(playable.year).toBeUndefined();
        });

        it('handles movies with zero duration', () => {
            const movie: BaseItemDto = {
                Id: 'movie-1',
                Name: 'Zero Duration Movie',
                Type: 'Movie',
                ServerId: 'server-1',
                RunTimeTicks: 0
            };

            const playable = toVideoItem(movie);

            expect(playable.duration).toBeUndefined();
        });
    });

    describe('playback context', () => {
        it('creates valid starting point for movie playback', () => {
            const movie: BaseItemDto = {
                Id: 'movie-start-1',
                Name: 'Start Movie',
                Type: 'Movie',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(movie);

            expect(playable.id).toBeTruthy();
            expect(playable.mediaType).toBe('Video');
            expect(playable.serverId).toBe('server-1');
        });

        it('handles binge-watching scenario with multiple movies', () => {
            const movies: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'movie-2', Name: 'Movie 2', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'movie-3', Name: 'Movie 3', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = toVideoItems(movies);

            expect(queue).toHaveLength(3);
            queue.forEach((item, index) => {
                expect(item.id).toBe(`movie-${index + 1}`);
                expect(item.mediaType).toBe('Video');
            });
        });
    });
});
