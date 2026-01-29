/**
 * Favorites View Tests
 *
 * Integration tests for favorites with playback functionality.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { toPlayableItem } from 'lib/utils/playbackUtils';
import { describe, expect, it } from 'vitest';

describe('Favorites integration', () => {
    describe('favorite item playback conversion', () => {
        it('converts favorite movie to playable format', () => {
            const movie: BaseItemDto = {
                Id: 'fav-movie-1',
                Name: 'Favorite Movie',
                Type: 'Movie',
                ServerId: 'server-1',
                ProductionYear: 2023,
                OfficialRating: 'PG-13'
            };

            const playable = toPlayableItem(movie);

            expect(playable.id).toBe('fav-movie-1');
            expect(playable.title).toBe('Favorite Movie');
            expect(playable.mediaType).toBe('Video');
            expect(playable.year).toBe(2023);
        });

        it('converts favorite TV show to playable format', () => {
            const show: BaseItemDto = {
                Id: 'fav-show-1',
                Name: 'Favorite Show',
                Type: 'Series',
                ServerId: 'server-1',
                ProductionYear: 2022
            };

            const playable = toPlayableItem(show);

            expect(playable.id).toBe('fav-show-1');
            expect(playable.title).toBe('Favorite Show');
            expect(playable.mediaType).toBe('Video');
        });

        it('converts favorite album to playable format', () => {
            const album: BaseItemDto = {
                Id: 'fav-album-1',
                Name: 'Favorite Album',
                Type: 'MusicAlbum',
                ServerId: 'server-1',
                AlbumArtist: 'Test Artist'
            };

            const playable = toPlayableItem(album);

            expect(playable.id).toBe('fav-album-1');
            expect(playable.title).toBe('Favorite Album');
            expect(playable.artist).toBe('Test Artist');
        });

        it('converts favorite artist to playable format', () => {
            const artist: BaseItemDto = {
                Id: 'fav-artist-1',
                Name: 'Favorite Artist',
                Type: 'MusicArtist',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(artist);

            expect(playable.id).toBe('fav-artist-1');
            expect(playable.title).toBe('Favorite Artist');
        });

        it('converts favorite playlist to playable format', () => {
            const playlist: BaseItemDto = {
                Id: 'fav-playlist-1',
                Name: 'Favorite Playlist',
                Type: 'Playlist',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(playlist);

            expect(playable.id).toBe('fav-playlist-1');
            expect(playable.title).toBe('Favorite Playlist');
        });
    });

    describe('favorite collection types', () => {
        it('handles favorites from multiple media types', () => {
            const favorites: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'show-1', Name: 'Show', Type: 'Series', ServerId: 'server-1' },
                { Id: 'album-1', Name: 'Album', Type: 'MusicAlbum', ServerId: 'server-1' },
                { Id: 'artist-1', Name: 'Artist', Type: 'MusicArtist', ServerId: 'server-1' }
            ];

            favorites.forEach((item, index) => {
                const playable = toPlayableItem(item);
                expect(playable.id).toBe(`${['movie', 'show', 'album', 'artist'][index]}-1`);
                expect(playable.title).toBe(item.Name);
            });
        });

        it('handles favorite collections', () => {
            const collection: BaseItemDto = {
                Id: 'fav-collection-1',
                Name: 'Favorite Collection',
                Type: 'BoxSet',
                ServerId: 'server-1',
                ProductionYear: 2023
            };

            const playable = toPlayableItem(collection);

            expect(playable.id).toBe('fav-collection-1');
            expect(playable.title).toBe('Favorite Collection');
            expect(playable.year).toBe(2023);
        });

        it('handles favorite playlists', () => {
            const playlists: BaseItemDto[] = [
                { Id: 'playlist-1', Name: 'Loved Songs', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'playlist-2', Name: 'Rock Classics', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'playlist-3', Name: 'Workout Mix', Type: 'Playlist', ServerId: 'server-1' }
            ];

            playlists.forEach((playlist, index) => {
                const playable = toPlayableItem(playlist);
                expect(playable.title).toBe(['Loved Songs', 'Rock Classics', 'Workout Mix'][index]);
            });
        });
    });

    describe('playback scenarios', () => {
        it('enables playback of single favorite item', () => {
            const favorite: BaseItemDto = {
                Id: 'single-fav',
                Name: 'Single Favorite',
                Type: 'Movie',
                ServerId: 'server-1'
            };

            const queue = [toPlayableItem(favorite)];

            expect(queue).toHaveLength(1);
            expect(queue[0].id).toBe('single-fav');
        });

        it('supports playing favorite albums', () => {
            const albums: BaseItemDto[] = [
                { Id: 'album-1', Name: 'Album 1', Type: 'MusicAlbum', ServerId: 'server-1' },
                { Id: 'album-2', Name: 'Album 2', Type: 'MusicAlbum', ServerId: 'server-1' },
                { Id: 'album-3', Name: 'Album 3', Type: 'MusicAlbum', ServerId: 'server-1' }
            ];

            const queue = albums.map(toPlayableItem);

            expect(queue).toHaveLength(3);
            queue.forEach((item, index) => {
                expect(item.title).toBe(`Album ${index + 1}`);
            });
        });

        it('supports playing favorite artists with shuffle', () => {
            const artists: BaseItemDto[] = [
                { Id: 'artist-1', Name: 'Artist 1', Type: 'MusicArtist', ServerId: 'server-1' },
                { Id: 'artist-2', Name: 'Artist 2', Type: 'MusicArtist', ServerId: 'server-1' },
                { Id: 'artist-3', Name: 'Artist 3', Type: 'MusicArtist', ServerId: 'server-1' }
            ];

            const shuffled = [...artists].sort(() => Math.random() - 0.5);
            const queue = shuffled.map(toPlayableItem);

            expect(queue).toHaveLength(3);
            queue.forEach((item) => {
                expect(item.title).toMatch(/^Artist \d+$/);
            });
        });

        it('supports browsing favorite sections with playback', () => {
            const section = {
                title: 'Favorite Movies',
                items: Array.from({ length: 12 }, (_, i) => ({
                    Id: `fav-movie-${i}`,
                    Name: `Favorite Movie ${i + 1}`,
                    Type: 'Movie' as const,
                    ServerId: 'server-1'
                }))
            };

            const queue = section.items.slice(0, 12).map(toPlayableItem);

            expect(queue).toHaveLength(12);
            queue.forEach((item, index) => {
                expect(item.title).toBe(`Favorite Movie ${index + 1}`);
            });
        });
    });

    describe('error handling', () => {
        it('handles favorite items with missing optional metadata', () => {
            const favorite: BaseItemDto = {
                Id: 'minimal-fav',
                Name: 'Minimal Favorite',
                Type: 'Movie',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(favorite);

            expect(playable.id).toBe('minimal-fav');
            expect(playable.year).toBeUndefined();
            expect(playable.duration).toBeUndefined();
        });

        it('handles favorite with special characters in name', () => {
            const favorite: BaseItemDto = {
                Id: 'fav-special',
                Name: 'My Favorite: The Best Edition (2023)',
                Type: 'Movie',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(favorite);

            expect(playable.title).toBe('My Favorite: The Best Edition (2023)');
        });

        it('handles empty favorite section', () => {
            const emptySection: BaseItemDto[] = [];
            const queue = emptySection.map(toPlayableItem);

            expect(queue).toEqual([]);
        });

        it('preserves favorite metadata for playback', () => {
            const favorite: BaseItemDto = {
                Id: 'fav-metadata',
                Name: 'Favorite with Metadata',
                Type: 'MusicAlbum',
                ServerId: 'server-1',
                AlbumArtist: 'Album Artist',
                ProductionYear: 2022
            };

            const playable = toPlayableItem(favorite);

            expect(playable).toMatchObject({
                id: 'fav-metadata',
                title: 'Favorite with Metadata',
                artist: 'Album Artist',
                year: 2022
            });
        });
    });

    describe('favorite sections', () => {
        it('handles movie favorites section', () => {
            const movies: BaseItemDto[] = [
                { Id: 'm-1', Name: 'Movie 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'm-2', Name: 'Movie 2', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'm-3', Name: 'Movie 3', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = movies.map(toPlayableItem);

            expect(queue).toHaveLength(3);
            queue.forEach((item, i) => {
                expect(item.id).toBe(`m-${i + 1}`);
            });
        });

        it('handles show favorites section', () => {
            const shows: BaseItemDto[] = [
                { Id: 's-1', Name: 'Show 1', Type: 'Series', ServerId: 'server-1' },
                { Id: 's-2', Name: 'Show 2', Type: 'Series', ServerId: 'server-1' }
            ];

            const queue = shows.map(toPlayableItem);

            expect(queue).toHaveLength(2);
        });

        it('handles album favorites section', () => {
            const albums: BaseItemDto[] = [
                {
                    Id: 'a-1',
                    Name: 'Album 1',
                    Type: 'MusicAlbum',
                    ServerId: 'server-1',
                    AlbumArtist: 'Artist A'
                },
                {
                    Id: 'a-2',
                    Name: 'Album 2',
                    Type: 'MusicAlbum',
                    ServerId: 'server-1',
                    AlbumArtist: 'Artist B'
                }
            ];

            const queue = albums.map(toPlayableItem);

            expect(queue).toHaveLength(2);
            queue.forEach((item, i) => {
                expect(item.artist).toBe(`Artist ${String.fromCharCode(65 + i)}`);
            });
        });

        it('handles artist favorites section', () => {
            const artists: BaseItemDto[] = Array.from({ length: 5 }, (_, i) => ({
                Id: `artist-${i}`,
                Name: `Artist ${i + 1}`,
                Type: 'MusicArtist' as const,
                ServerId: 'server-1'
            }));

            const queue = artists.map(toPlayableItem);

            expect(queue).toHaveLength(5);
        });

        it('limits section display to 12 items', () => {
            const favorites: BaseItemDto[] = Array.from({ length: 20 }, (_, i) => ({
                Id: `fav-${i}`,
                Name: `Favorite ${i + 1}`,
                Type: 'Movie' as const,
                ServerId: 'server-1'
            }));

            const displayed = favorites.slice(0, 12).map(toPlayableItem);

            expect(displayed).toHaveLength(12);
            expect(displayed[0].id).toBe('fav-0');
            expect(displayed[11].id).toBe('fav-11');
        });
    });

    describe('favorite types', () => {
        it('handles all supported favorite types', () => {
            const favorites: BaseItemDto[] = [
                { Id: 'fav-movie', Name: 'Favorite Movie', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'fav-series', Name: 'Favorite Series', Type: 'Series', ServerId: 'server-1' },
                {
                    Id: 'fav-album',
                    Name: 'Favorite Album',
                    Type: 'MusicAlbum',
                    ServerId: 'server-1'
                },
                {
                    Id: 'fav-artist',
                    Name: 'Favorite Artist',
                    Type: 'MusicArtist',
                    ServerId: 'server-1'
                },
                {
                    Id: 'fav-playlist',
                    Name: 'Favorite Playlist',
                    Type: 'Playlist',
                    ServerId: 'server-1'
                },
                { Id: 'fav-boxset', Name: 'Favorite BoxSet', Type: 'BoxSet', ServerId: 'server-1' },
                { Id: 'fav-audio', Name: 'Favorite Audio', Type: 'Audio', ServerId: 'server-1' }
            ];

            favorites.forEach((favorite) => {
                const playable = toPlayableItem(favorite);

                expect(playable.id).toBe(favorite.Id);
                expect(playable.title).toBe(favorite.Name);
            });
        });

        it('handles collection type (BoxSet)', () => {
            const collection: BaseItemDto = {
                Id: 'collection-1',
                Name: 'Collection Name',
                Type: 'BoxSet',
                ServerId: 'server-1',
                ProductionYear: 2023
            };

            const playable = toPlayableItem(collection);

            expect(playable.id).toBe('collection-1');
            expect(playable.year).toBe(2023);
        });
    });
});
