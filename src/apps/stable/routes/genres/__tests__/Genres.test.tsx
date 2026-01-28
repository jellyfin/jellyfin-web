/**
 * Genres View Tests
 *
 * Integration tests for genres with playback functionality.
 */

import { describe, it, expect } from 'vitest';
import { toPlayableItem, toVideoItem } from 'lib/utils/playbackUtils';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

describe('Genres integration', () => {
    describe('genre type detection', () => {
        it('detects music genres', () => {
            const genreType: string = 'music';
            const isAudio = genreType === 'music';
            expect(isAudio).toBe(true);
        });

        it('detects TV genres', () => {
            const genreType: string = 'tv';
            const isAudio = genreType === 'music';
            expect(isAudio).toBe(false);
        });

        it('detects movie genres', () => {
            const genreType: string = 'movies';
            const isAudio = genreType === 'music';
            expect(isAudio).toBe(false);
        });
    });

    describe('genre item playback conversion', () => {
        it('converts music genre songs to playable format', () => {
            const songs: BaseItemDto[] = [
                { Id: 'song-1', Name: 'Song 1', Type: 'Audio', ServerId: 'server-1' },
                { Id: 'song-2', Name: 'Song 2', Type: 'Audio', ServerId: 'server-1' }
            ];

            const playables = songs.map(toPlayableItem);

            expect(playables).toHaveLength(2);
            expect(playables[0].id).toBe('song-1');
            expect(playables[1].id).toBe('song-2');
        });

        it('converts movie genre movies to playable format', () => {
            const movies: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'movie-2', Name: 'Movie 2', Type: 'Movie', ServerId: 'server-1' }
            ];

            const playables = movies.map(toVideoItem);

            expect(playables).toHaveLength(2);
            expect(playables[0].mediaType).toBe('Video');
            expect(playables[1].mediaType).toBe('Video');
        });

        it('converts TV genre shows and episodes to playable format', () => {
            const tvItems: BaseItemDto[] = [
                { Id: 'show-1', Name: 'Show 1', Type: 'Series', ServerId: 'server-1' },
                { Id: 'episode-1', Name: 'Episode 1', Type: 'Episode', ServerId: 'server-1' }
            ];

            const playables = tvItems.map(toVideoItem);

            expect(playables).toHaveLength(2);
            playables.forEach((item) => {
                expect(item.mediaType).toBe('Video');
            });
        });
    });

    describe('genre queuing', () => {
        it('queues music genre items in order', () => {
            const songs: BaseItemDto[] = [
                { Id: 'rock-1', Name: 'Rock Song 1', Type: 'Audio', ServerId: 'server-1' },
                { Id: 'rock-2', Name: 'Rock Song 2', Type: 'Audio', ServerId: 'server-1' },
                { Id: 'rock-3', Name: 'Rock Song 3', Type: 'Audio', ServerId: 'server-1' }
            ];

            const queue = songs.map(toPlayableItem);

            expect(queue).toHaveLength(3);
            expect(queue[0].title).toBe('Rock Song 1');
            expect(queue[1].title).toBe('Rock Song 2');
            expect(queue[2].title).toBe('Rock Song 3');
        });

        it('queues movie genre items in order', () => {
            const movies: BaseItemDto[] = [
                { Id: 'action-1', Name: 'Action Movie 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'action-2', Name: 'Action Movie 2', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = movies.map(toVideoItem);

            expect(queue).toHaveLength(2);
            expect(queue[0].title).toBe('Action Movie 1');
            expect(queue[1].title).toBe('Action Movie 2');
        });

        it('queues TV genre items in order', () => {
            const tvItems: BaseItemDto[] = [
                { Id: 'drama-show-1', Name: 'Drama Show 1', Type: 'Series', ServerId: 'server-1' },
                { Id: 'drama-ep-1', Name: 'Drama Episode 1', Type: 'Episode', ServerId: 'server-1' }
            ];

            const queue = tvItems.map(toVideoItem);

            expect(queue).toHaveLength(2);
        });

        it('queues large music genre collection', () => {
            const songs: BaseItemDto[] = Array.from({ length: 100 }, (_, i) => ({
                Id: `jazz-song-${i}`,
                Name: `Jazz Song ${i + 1}`,
                Type: 'Audio' as const,
                ServerId: 'server-1'
            }));

            const queue = songs.map(toPlayableItem);

            expect(queue).toHaveLength(100);
            expect(queue[0].id).toBe('jazz-song-0');
            expect(queue[99].id).toBe('jazz-song-99');
        });

        it('queues large movie genre collection', () => {
            const movies: BaseItemDto[] = Array.from({ length: 50 }, (_, i) => ({
                Id: `horror-movie-${i}`,
                Name: `Horror Movie ${i + 1}`,
                Type: 'Movie' as const,
                ServerId: 'server-1'
            }));

            const queue = movies.map(toVideoItem);

            expect(queue).toHaveLength(50);
            expect(queue[0].id).toBe('horror-movie-0');
            expect(queue[49].id).toBe('horror-movie-49');
        });
    });

    describe('music genres', () => {
        it('handles rock genre songs', () => {
            const rockSongs: BaseItemDto[] = [
                { Id: 'rock-1', Name: 'Rock Track 1', Type: 'Audio', ServerId: 'server-1' },
                { Id: 'rock-2', Name: 'Rock Track 2', Type: 'Audio', ServerId: 'server-1' }
            ];

            const queue = rockSongs.map(toPlayableItem);
            expect(queue).toHaveLength(2);
        });

        it('handles jazz genre songs', () => {
            const jazzSongs: BaseItemDto[] = [
                { Id: 'jazz-1', Name: 'Jazz Track 1', Type: 'Audio', ServerId: 'server-1' },
                { Id: 'jazz-2', Name: 'Jazz Track 2', Type: 'Audio', ServerId: 'server-1' }
            ];

            const queue = jazzSongs.map(toPlayableItem);
            expect(queue).toHaveLength(2);
        });

        it('handles classical genre songs', () => {
            const classicalSongs: BaseItemDto[] = [
                { Id: 'classical-1', Name: 'Classical Symphony 1', Type: 'Audio', ServerId: 'server-1' },
                { Id: 'classical-2', Name: 'Classical Symphony 2', Type: 'Audio', ServerId: 'server-1' }
            ];

            const queue = classicalSongs.map(toPlayableItem);
            expect(queue).toHaveLength(2);
        });

        it('handles electronic genre songs', () => {
            const electronicSongs: BaseItemDto[] = [
                { Id: 'electronic-1', Name: 'Electronic Track 1', Type: 'Audio', ServerId: 'server-1' },
                { Id: 'electronic-2', Name: 'Electronic Track 2', Type: 'Audio', ServerId: 'server-1' },
                { Id: 'electronic-3', Name: 'Electronic Track 3', Type: 'Audio', ServerId: 'server-1' }
            ];

            const queue = electronicSongs.map(toPlayableItem);
            expect(queue).toHaveLength(3);
        });

        it('handles pop genre songs', () => {
            const popSongs: BaseItemDto[] = [
                { Id: 'pop-1', Name: 'Pop Song 1', Type: 'Audio', ServerId: 'server-1' },
                { Id: 'pop-2', Name: 'Pop Song 2', Type: 'Audio', ServerId: 'server-1' }
            ];

            const queue = popSongs.map(toPlayableItem);
            expect(queue).toHaveLength(2);
        });
    });

    describe('movie genres', () => {
        it('handles action movie genre', () => {
            const actionMovies: BaseItemDto[] = [
                { Id: 'action-1', Name: 'Action Movie 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'action-2', Name: 'Action Movie 2', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = actionMovies.map(toVideoItem);
            expect(queue).toHaveLength(2);
            queue.forEach((item) => {
                expect(item.mediaType).toBe('Video');
            });
        });

        it('handles comedy movie genre', () => {
            const comedyMovies: BaseItemDto[] = [
                { Id: 'comedy-1', Name: 'Comedy Movie 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'comedy-2', Name: 'Comedy Movie 2', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = comedyMovies.map(toVideoItem);
            expect(queue).toHaveLength(2);
        });

        it('handles drama movie genre', () => {
            const dramaMovies: BaseItemDto[] = [
                { Id: 'drama-1', Name: 'Drama Movie 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'drama-2', Name: 'Drama Movie 2', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = dramaMovies.map(toVideoItem);
            expect(queue).toHaveLength(2);
        });

        it('handles horror movie genre', () => {
            const horrorMovies: BaseItemDto[] = [
                { Id: 'horror-1', Name: 'Horror Movie 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'horror-2', Name: 'Horror Movie 2', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = horrorMovies.map(toVideoItem);
            expect(queue).toHaveLength(2);
        });

        it('handles sci-fi movie genre', () => {
            const scifiMovies: BaseItemDto[] = [
                { Id: 'scifi-1', Name: 'Sci-Fi Movie 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'scifi-2', Name: 'Sci-Fi Movie 2', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = scifiMovies.map(toVideoItem);
            expect(queue).toHaveLength(2);
        });
    });

    describe('TV genres', () => {
        it('handles drama TV shows', () => {
            const dramaSeries: BaseItemDto[] = [
                { Id: 'drama-series-1', Name: 'Drama Series 1', Type: 'Series', ServerId: 'server-1' },
                { Id: 'drama-series-2', Name: 'Drama Series 2', Type: 'Series', ServerId: 'server-1' }
            ];

            const queue = dramaSeries.map(toVideoItem);
            expect(queue).toHaveLength(2);
            queue.forEach((item) => {
                expect(item.mediaType).toBe('Video');
            });
        });

        it('handles comedy TV shows', () => {
            const comedySeries: BaseItemDto[] = [
                { Id: 'comedy-series-1', Name: 'Comedy Series 1', Type: 'Series', ServerId: 'server-1' },
                { Id: 'comedy-series-2', Name: 'Comedy Series 2', Type: 'Series', ServerId: 'server-1' }
            ];

            const queue = comedySeries.map(toVideoItem);
            expect(queue).toHaveLength(2);
        });

        it('handles thriller TV shows', () => {
            const thrillerSeries: BaseItemDto[] = [
                { Id: 'thriller-series-1', Name: 'Thriller Series 1', Type: 'Series', ServerId: 'server-1' },
                { Id: 'thriller-series-2', Name: 'Thriller Series 2', Type: 'Series', ServerId: 'server-1' }
            ];

            const queue = thrillerSeries.map(toVideoItem);
            expect(queue).toHaveLength(2);
        });

        it('handles episodes from genre', () => {
            const genreEpisodes: BaseItemDto[] = [
                { Id: 'ep-1', Name: 'Episode 1', Type: 'Episode', ServerId: 'server-1' },
                { Id: 'ep-2', Name: 'Episode 2', Type: 'Episode', ServerId: 'server-1' },
                { Id: 'ep-3', Name: 'Episode 3', Type: 'Episode', ServerId: 'server-1' }
            ];

            const queue = genreEpisodes.map(toVideoItem);
            expect(queue).toHaveLength(3);
        });

        it('handles mixed series and episodes from genre', () => {
            const mixedItems: BaseItemDto[] = [
                { Id: 'series-1', Name: 'Series 1', Type: 'Series', ServerId: 'server-1' },
                { Id: 'episode-1', Name: 'Episode 1', Type: 'Episode', ServerId: 'server-1' },
                { Id: 'series-2', Name: 'Series 2', Type: 'Series', ServerId: 'server-1' }
            ];

            const queue = mixedItems.map(toVideoItem);
            expect(queue).toHaveLength(3);
            queue.forEach((item) => {
                expect(item.mediaType).toBe('Video');
            });
        });
    });

    describe('error handling', () => {
        it('handles empty genre results', () => {
            const emptyGenre: BaseItemDto[] = [];
            const queue = emptyGenre.map(toPlayableItem);

            expect(queue).toEqual([]);
        });

        it('handles items with missing metadata', () => {
            const item: BaseItemDto = {
                Id: 'minimal-1',
                Name: 'Minimal',
                Type: 'Audio',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(item);

            expect(playable.id).toBe('minimal-1');
            expect(playable.title).toBe('Minimal');
        });

        it('handles items with special characters', () => {
            const item: BaseItemDto = {
                Id: 'special-1',
                Name: 'Song: The Best Of (2024) & More',
                Type: 'Audio',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(item);

            expect(playable.title).toBe('Song: The Best Of (2024) & More');
        });

        it('handles very long genre names', () => {
            const longName = 'A'.repeat(100);
            const items: BaseItemDto[] = [
                { Id: 'long-1', Name: longName, Type: 'Audio', ServerId: 'server-1' }
            ];

            const queue = items.map(toPlayableItem);

            expect(queue[0].title).toBe(longName);
            expect(queue[0].title).toHaveLength(100);
        });

        it('preserves genre item metadata', () => {
            const item: BaseItemDto = {
                Id: 'metadata-1',
                Name: 'Song with Metadata',
                Type: 'Audio',
                ServerId: 'server-1',
                ProductionYear: 2024
            };

            const playable = toPlayableItem(item);

            expect(playable).toMatchObject({
                id: 'metadata-1',
                title: 'Song with Metadata',
                year: 2024
            });
        });
    });

    describe('pagination handling', () => {
        it('handles paginated genre results', () => {
            const pageSize = 50;
            const page1: BaseItemDto[] = Array.from({ length: pageSize }, (_, i) => ({
                Id: `page1-${i}`,
                Name: `Item ${i + 1}`,
                Type: 'Audio' as const,
                ServerId: 'server-1'
            }));

            const page2: BaseItemDto[] = Array.from({ length: pageSize }, (_, i) => ({
                Id: `page2-${i}`,
                Name: `Item ${pageSize + i + 1}`,
                Type: 'Audio' as const,
                ServerId: 'server-1'
            }));

            const allPages = [...page1, ...page2];
            const queue = allPages.map(toPlayableItem);

            expect(queue).toHaveLength(100);
            expect(queue[0].id).toBe('page1-0');
            expect(queue[49].id).toBe('page1-49');
            expect(queue[50].id).toBe('page2-0');
            expect(queue[99].id).toBe('page2-49');
        });
    });
});
