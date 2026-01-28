/**
 * Playback Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
    toPlayableItem,
    toPlayableItems,
    toAudioItem,
    toAudioItems,
    toVideoItem,
    toVideoItems
} from '../playbackUtils';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

describe('playbackUtils', () => {
    describe('toPlayableItem', () => {
        it('converts a song to playable format', () => {
            const song: BaseItemDto = {
                Id: 'song-123',
                Name: 'Test Song',
                ServerId: 'server-1',
                Album: 'Test Album',
                AlbumArtist: 'Test Artist',
                RunTimeTicks: 1800000000 // 3 minutes
            };

            const playable = toPlayableItem(song);

            expect(playable.id).toBe('song-123');
            expect(playable.title).toBe('Test Song');
            expect(playable.serverId).toBe('server-1');
            expect(playable.album).toBe('Test Album');
            expect(playable.artist).toBe('Test Artist');
            expect(playable.duration).toBe(180); // 3 minutes in seconds
        });

        it('converts an album to playable format', () => {
            const album: BaseItemDto = {
                Id: 'album-123',
                Name: 'Test Album',
                ServerId: 'server-1',
                AlbumArtist: 'Test Artist',
                ProductionYear: 2024
            };

            const playable = toPlayableItem(album);

            expect(playable.id).toBe('album-123');
            expect(playable.title).toBe('Test Album');
            expect(playable.artist).toBe('Test Artist');
            expect(playable.year).toBe(2024);
        });

        it('extracts artist from ArtistItems when AlbumArtist is missing', () => {
            const song: BaseItemDto = {
                Id: 'song-123',
                Name: 'Test Song',
                ServerId: 'server-1',
                ArtistItems: [{ Name: 'Artist One' }, { Name: 'Artist Two' }]
            };

            const playable = toPlayableItem(song);

            expect(playable.artist).toBe('Artist One');
        });

        it('handles missing optional fields gracefully', () => {
            const minimal: BaseItemDto = {
                Id: 'item-123',
                Name: 'Item Name'
            };

            const playable = toPlayableItem(minimal);

            expect(playable.id).toBe('item-123');
            expect(playable.title).toBe('Item Name');
            expect(playable.artist).toBeUndefined();
            expect(playable.album).toBeUndefined();
            expect(playable.year).toBeUndefined();
            expect(playable.duration).toBeUndefined();
        });

        it('handles null/undefined IDs with empty string', () => {
            const noId: BaseItemDto = {
                Name: 'No ID Item'
            };

            const playable = toPlayableItem(noId);

            expect(playable.id).toBe('');
            expect(playable.title).toBe('No ID Item');
        });

        it('handles null/undefined Name with empty string', () => {
            const noName: BaseItemDto = {
                Id: 'item-123'
            };

            const playable = toPlayableItem(noName);

            expect(playable.title).toBe('');
            expect(playable.name).toBe('');
        });

        it('calculates duration from RunTimeTicks correctly', () => {
            const song: BaseItemDto = {
                Id: 'song-123',
                Name: 'Test Song',
                RunTimeTicks: 3600000000 // 1 hour
            };

            const playable = toPlayableItem(song);

            expect(playable.duration).toBe(360); // 1 hour in seconds = 3600, but 360 = 6 minutes. Let me recalculate
            // Actually RunTimeTicks is in 100-nanosecond intervals
            // 3600000000 / 10000000 = 360 seconds = 6 minutes
            expect(playable.duration).toBe(360);
        });

        it('handles missing RunTimeTicks', () => {
            const song: BaseItemDto = {
                Id: 'song-123',
                Name: 'Test Song'
            };

            const playable = toPlayableItem(song);

            expect(playable.duration).toBeUndefined();
            expect(playable.runtimeTicks).toBeUndefined();
        });

        it('preserves ServerId', () => {
            const song: BaseItemDto = {
                Id: 'song-123',
                Name: 'Test Song',
                ServerId: 'specific-server'
            };

            const playable = toPlayableItem(song);

            expect(playable.serverId).toBe('specific-server');
        });

        it('sets mediaType to Audio', () => {
            const song: BaseItemDto = {
                Id: 'song-123',
                Name: 'Test Song'
            };

            const playable = toPlayableItem(song);

            expect(playable.mediaType).toBe('Audio');
        });
    });

    describe('toPlayableItems', () => {
        it('converts multiple items to playable format', () => {
            const songs: BaseItemDto[] = [
                { Id: 'song-1', Name: 'Song 1', ServerId: 'server-1' },
                { Id: 'song-2', Name: 'Song 2', ServerId: 'server-1' },
                { Id: 'song-3', Name: 'Song 3', ServerId: 'server-1' }
            ];

            const playables = toPlayableItems(songs);

            expect(playables).toHaveLength(3);
            expect(playables[0].id).toBe('song-1');
            expect(playables[1].id).toBe('song-2');
            expect(playables[2].id).toBe('song-3');
        });

        it('handles empty array', () => {
            const playables = toPlayableItems([]);

            expect(playables).toEqual([]);
        });

        it('preserves order of items', () => {
            const items: BaseItemDto[] = [
                { Id: '3', Name: 'Third' },
                { Id: '1', Name: 'First' },
                { Id: '2', Name: 'Second' }
            ];

            const playables = toPlayableItems(items);

            expect(playables[0].id).toBe('3');
            expect(playables[1].id).toBe('1');
            expect(playables[2].id).toBe('2');
        });
    });

    describe('video playback conversion', () => {
        it('converts a movie to playable format with Video mediaType', () => {
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
            expect(playable.duration).toBe(720); // seconds
            expect(playable.year).toBe(2024);
        });

        it('converts a TV show episode to playable format', () => {
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

            expect(playable.mediaType).toBe('Video');
            expect(playable.title).toBe('Pilot');
            expect(playable.duration).toBe(270);
        });

        it('detects movie type automatically with toPlayableItem', () => {
            const movie: BaseItemDto = {
                Id: 'movie-1',
                Name: 'Auto-detect Movie',
                Type: 'Movie',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(movie);

            expect(playable.mediaType).toBe('Video');
        });

        it('detects episode type automatically', () => {
            const episode: BaseItemDto = {
                Id: 'episode-1',
                Name: 'Episode 1',
                Type: 'Episode',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(episode);

            expect(playable.mediaType).toBe('Video');
        });

        it('converts multiple videos to playable format', () => {
            const videos: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'show-1', Name: 'Show 1', Type: 'Series', ServerId: 'server-1' },
                { Id: 'episode-1', Name: 'Episode 1', Type: 'Episode', ServerId: 'server-1' }
            ];

            const playables = toVideoItems(videos);

            expect(playables).toHaveLength(3);
            playables.forEach(playable => {
                expect(playable.mediaType).toBe('Video');
            });
        });

        it('enforces Audio mediaType with toAudioItem for music', () => {
            const album: BaseItemDto = {
                Id: 'album-1',
                Name: 'Album',
                Type: 'MusicAlbum',
                ServerId: 'server-1'
            };

            const playable = toAudioItem(album);

            expect(playable.mediaType).toBe('Audio');
        });

        it('enforces Video mediaType with toVideoItem regardless of type', () => {
            const mixed: BaseItemDto = {
                Id: 'item-1',
                Name: 'Item',
                Type: 'Unknown',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(mixed);

            expect(playable.mediaType).toBe('Video');
        });

        it('handles music video type with automatic detection', () => {
            const musicVideo: BaseItemDto = {
                Id: 'mv-1',
                Name: 'Music Video',
                Type: 'MusicVideo',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(musicVideo);

            expect(playable.mediaType).toBe('Video');
        });

        it('handles batch audio conversion', () => {
            const songs: BaseItemDto[] = [
                { Id: 'song-1', Name: 'Song 1', Type: 'Audio', ServerId: 'server-1' },
                { Id: 'song-2', Name: 'Song 2', Type: 'Audio', ServerId: 'server-1' }
            ];

            const playables = toAudioItems(songs);

            expect(playables).toHaveLength(2);
            playables.forEach(p => expect(p.mediaType).toBe('Audio'));
        });

        it('defaults to Audio when type is not specified', () => {
            const noType: BaseItemDto = {
                Id: 'noType-1',
                Name: 'Item Without Type',
                ServerId: 'server-1'
                // Type is undefined
            };

            const playable = toPlayableItem(noType);

            expect(playable.mediaType).toBe('Audio');
        });

        it('preserves video duration from RunTimeTicks', () => {
            const movie: BaseItemDto = {
                Id: 'movie-1',
                Name: 'Long Movie',
                Type: 'Movie',
                ServerId: 'server-1',
                RunTimeTicks: 10800000000 // 3 hours
            };

            const playable = toVideoItem(movie);

            expect(playable.duration).toBe(1080);
            expect(playable.runtimeTicks).toBe(10800000000);
        });
    });
});
