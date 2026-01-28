/**
 * Search View Tests
 *
 * Integration tests for search with mixed media type playback.
 */

import { describe, it, expect } from 'vitest';
import { toPlayableItem, toVideoItem } from 'lib/utils/playbackUtils';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

describe('Search integration', () => {
    describe('search result playback conversion - audio', () => {
        it('converts search result audio song to playable format', () => {
            const song: BaseItemDto = {
                Id: 'song-search-1',
                Name: 'Song Name',
                Type: 'Audio',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(song);

            expect(playable.id).toBe('song-search-1');
            expect(playable.title).toBe('Song Name');
        });

        it('converts search result album to playable format', () => {
            const album: BaseItemDto = {
                Id: 'album-search-1',
                Name: 'Album Name',
                Type: 'MusicAlbum',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(album);

            expect(playable.id).toBe('album-search-1');
            expect(playable.title).toBe('Album Name');
        });

        it('converts search result artist to playable format', () => {
            const artist: BaseItemDto = {
                Id: 'artist-search-1',
                Name: 'Artist Name',
                Type: 'MusicArtist',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(artist);

            expect(playable.id).toBe('artist-search-1');
            expect(playable.title).toBe('Artist Name');
        });
    });

    describe('search result playback conversion - video', () => {
        it('converts search result movie to playable format', () => {
            const movie: BaseItemDto = {
                Id: 'movie-search-1',
                Name: 'Movie Name',
                Type: 'Movie',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(movie);

            expect(playable.id).toBe('movie-search-1');
            expect(playable.title).toBe('Movie Name');
            expect(playable.mediaType).toBe('Video');
        });

        it('converts search result TV show to playable format', () => {
            const show: BaseItemDto = {
                Id: 'show-search-1',
                Name: 'Show Name',
                Type: 'Series',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(show);

            expect(playable.id).toBe('show-search-1');
            expect(playable.title).toBe('Show Name');
            expect(playable.mediaType).toBe('Video');
        });

        it('converts search result episode to playable format', () => {
            const episode: BaseItemDto = {
                Id: 'episode-search-1',
                Name: 'Episode Name',
                Type: 'Episode',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(episode);

            expect(playable.id).toBe('episode-search-1');
            expect(playable.title).toBe('Episode Name');
            expect(playable.mediaType).toBe('Video');
        });
    });

    describe('mixed media type search results', () => {
        it('handles search results with movies and songs', () => {
            const results: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'song-1', Name: 'Song', Type: 'Audio', ServerId: 'server-1' }
            ];

            results.forEach((item) => {
                const isAudio = item.Type === 'Audio' || item.Type === 'MusicArtist' || item.Type === 'MusicAlbum';
                const playable = isAudio ? toPlayableItem(item) : toVideoItem(item);
                expect(playable.id).toBeDefined();
                expect(playable.title).toBeDefined();
            });
        });

        it('handles search results with shows and albums', () => {
            const results: BaseItemDto[] = [
                { Id: 'show-1', Name: 'Show', Type: 'Series', ServerId: 'server-1' },
                { Id: 'album-1', Name: 'Album', Type: 'MusicAlbum', ServerId: 'server-1' }
            ];

            results.forEach((item) => {
                const isAudio = item.Type === 'Audio' || item.Type === 'MusicArtist' || item.Type === 'MusicAlbum';
                const playable = isAudio ? toPlayableItem(item) : toVideoItem(item);
                expect(playable.id).toBeDefined();
            });
        });

        it('handles search results with episodes and artists', () => {
            const results: BaseItemDto[] = [
                { Id: 'episode-1', Name: 'Episode', Type: 'Episode', ServerId: 'server-1' },
                { Id: 'artist-1', Name: 'Artist', Type: 'MusicArtist', ServerId: 'server-1' }
            ];

            results.forEach((item) => {
                const isAudio = item.Type === 'Audio' || item.Type === 'MusicArtist' || item.Type === 'MusicAlbum';
                const playable = isAudio ? toPlayableItem(item) : toVideoItem(item);
                expect(playable.id).toBeDefined();
            });
        });

        it('handles large mixed media search results', () => {
            const results: BaseItemDto[] = [
                ...Array.from({ length: 10 }, (_, i) => ({ Id: `movie-${i}`, Name: `Movie ${i}`, Type: 'Movie' as const, ServerId: 'server-1' })),
                ...Array.from({ length: 10 }, (_, i) => ({ Id: `song-${i}`, Name: `Song ${i}`, Type: 'Audio' as const, ServerId: 'server-1' })),
                ...Array.from({ length: 10 }, (_, i) => ({ Id: `show-${i}`, Name: `Show ${i}`, Type: 'Series' as const, ServerId: 'server-1' })),
                ...Array.from({ length: 10 }, (_, i) => ({ Id: `album-${i}`, Name: `Album ${i}`, Type: 'MusicAlbum' as const, ServerId: 'server-1' }))
            ];

            const playables = results.map((item) => {
                const isAudio = item.Type === 'Audio' || item.Type === 'MusicArtist' || item.Type === 'MusicAlbum';
                return isAudio ? toPlayableItem(item) : toVideoItem(item);
            });

            expect(playables).toHaveLength(40);
        });
    });

    describe('search filtering', () => {
        it('filters search results for movies only', () => {
            const allResults: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'song-1', Name: 'Song', Type: 'Audio', ServerId: 'server-1' },
                { Id: 'show-1', Name: 'Show', Type: 'Series', ServerId: 'server-1' }
            ];

            const movieResults = allResults.filter(item => item.Type === 'Movie');

            expect(movieResults).toHaveLength(1);
            expect(movieResults[0].Type).toBe('Movie');
        });

        it('filters search results for audio only', () => {
            const allResults: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'song-1', Name: 'Song', Type: 'Audio', ServerId: 'server-1' },
                { Id: 'album-1', Name: 'Album', Type: 'MusicAlbum', ServerId: 'server-1' },
                { Id: 'artist-1', Name: 'Artist', Type: 'MusicArtist', ServerId: 'server-1' }
            ];

            const audioResults = allResults.filter(item =>
                item.Type === 'Audio' || item.Type === 'MusicAlbum' || item.Type === 'MusicArtist'
            );

            expect(audioResults).toHaveLength(3);
        });

        it('filters search results for video only', () => {
            const allResults: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'song-1', Name: 'Song', Type: 'Audio', ServerId: 'server-1' },
                { Id: 'show-1', Name: 'Show', Type: 'Series', ServerId: 'server-1' },
                { Id: 'episode-1', Name: 'Episode', Type: 'Episode', ServerId: 'server-1' }
            ];

            const videoResults = allResults.filter(item =>
                item.Type === 'Movie' || item.Type === 'Series' || item.Type === 'Episode'
            );

            expect(videoResults).toHaveLength(3);
        });
    });

    describe('search result playback queuing', () => {
        it('queues single search result for playback', () => {
            const result: BaseItemDto = {
                Id: 'result-1',
                Name: 'Result',
                Type: 'Movie',
                ServerId: 'server-1'
            };

            const queue = [toVideoItem(result)];

            expect(queue).toHaveLength(1);
            expect(queue[0].id).toBe('result-1');
        });

        it('queues multiple search results in order', () => {
            const results: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'movie-2', Name: 'Movie 2', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'movie-3', Name: 'Movie 3', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = results.map(toVideoItem);

            expect(queue).toHaveLength(3);
            expect(queue[0].title).toBe('Movie 1');
            expect(queue[1].title).toBe('Movie 2');
            expect(queue[2].title).toBe('Movie 3');
        });

        it('handles queuing mixed audio and video results', () => {
            const results: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'song-1', Name: 'Song', Type: 'Audio', ServerId: 'server-1' }
            ];

            const queue = results.map((item) => {
                const isAudio = item.Type === 'Audio';
                return isAudio ? toPlayableItem(item) : toVideoItem(item);
            });

            expect(queue).toHaveLength(2);
            expect(queue[0].id).toBe('movie-1');
            expect(queue[1].id).toBe('song-1');
        });
    });

    describe('error handling', () => {
        it('handles search results with missing metadata', () => {
            const result: BaseItemDto = {
                Id: 'minimal-1',
                Name: 'Minimal',
                Type: 'Movie',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(result);

            expect(playable.id).toBe('minimal-1');
            expect(playable.title).toBe('Minimal');
        });

        it('handles search results with special characters in name', () => {
            const result: BaseItemDto = {
                Id: 'special-1',
                Name: 'Movie: The Best (2024) & More',
                Type: 'Movie',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(result);

            expect(playable.title).toBe('Movie: The Best (2024) & More');
        });

        it('handles empty search results', () => {
            const results: BaseItemDto[] = [];
            const queue = results.map(toVideoItem);

            expect(queue).toEqual([]);
        });

        it('handles search results with very long names', () => {
            const longName = 'A'.repeat(200);
            const result: BaseItemDto = {
                Id: 'long-1',
                Name: longName,
                Type: 'Movie',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(result);

            expect(playable.title).toBe(longName);
            expect(playable.title).toHaveLength(200);
        });

        it('preserves search result metadata for playback', () => {
            const result: BaseItemDto = {
                Id: 'metadata-1',
                Name: 'Movie with Metadata',
                Type: 'Movie',
                ServerId: 'server-1',
                ProductionYear: 2023
            };

            const playable = toVideoItem(result);

            expect(playable).toMatchObject({
                id: 'metadata-1',
                title: 'Movie with Metadata',
                year: 2023
            });
        });
    });

    describe('search type conversions', () => {
        it('handles search type detection for audio items', () => {
            const audioTypes = ['Audio', 'MusicAlbum', 'MusicArtist'];
            const audioItems: BaseItemDto[] = audioTypes.map((type, i) => ({
                Id: `audio-${i}`,
                Name: `Audio Item ${i}`,
                Type: type as any,
                ServerId: 'server-1'
            }));

            audioItems.forEach((item) => {
                const isAudio = item.Type === 'Audio' || item.Type === 'MusicArtist' || item.Type === 'MusicAlbum';
                expect(isAudio).toBe(true);
                const playable = toPlayableItem(item);
                expect(playable.id).toBeDefined();
            });
        });

        it('handles search type detection for video items', () => {
            const videoTypes = ['Movie', 'Series', 'Episode'];
            const videoItems: BaseItemDto[] = videoTypes.map((type, i) => ({
                Id: `video-${i}`,
                Name: `Video Item ${i}`,
                Type: type as any,
                ServerId: 'server-1'
            }));

            videoItems.forEach((item) => {
                const isAudio = item.Type === 'Audio' || item.Type === 'MusicArtist' || item.Type === 'MusicAlbum';
                expect(isAudio).toBe(false);
                const playable = toVideoItem(item);
                expect(playable.mediaType).toBe('Video');
            });
        });

        it('handles playlist conversion in search results', () => {
            const playlist: BaseItemDto = {
                Id: 'playlist-search-1',
                Name: 'Playlist',
                Type: 'Playlist',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(playlist);

            expect(playable.id).toBe('playlist-search-1');
            expect(playable.title).toBe('Playlist');
        });
    });

    describe('pagination in search results', () => {
        it('handles paginated search results', () => {
            const pageSize = 50;
            const page1: BaseItemDto[] = Array.from({ length: pageSize }, (_, i) => ({
                Id: `p1-${i}`,
                Name: `Result ${i + 1}`,
                Type: 'Movie' as const,
                ServerId: 'server-1'
            }));

            const page2: BaseItemDto[] = Array.from({ length: pageSize }, (_, i) => ({
                Id: `p2-${i}`,
                Name: `Result ${pageSize + i + 1}`,
                Type: 'Movie' as const,
                ServerId: 'server-1'
            }));

            const allPages = [...page1, ...page2];
            const playables = allPages.map(toVideoItem);

            expect(playables).toHaveLength(100);
            expect(playables[0].id).toBe('p1-0');
            expect(playables[49].id).toBe('p1-49');
            expect(playables[50].id).toBe('p2-0');
            expect(playables[99].id).toBe('p2-49');
        });
    });
});
