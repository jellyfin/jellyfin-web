/**
 * Songs Component Tests
 *
 * Basic integration tests for the Songs view playback functionality.
 */

import { describe, it, expect } from 'vitest';
import { toPlayableItem, toPlayableItems } from 'lib/utils/playbackUtils';
import { createMockSongs, createMockSong } from 'test/factories/mediaItems';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

describe('Songs integration', () => {
    describe('single song playback', () => {
        it('converts single song to playable format', () => {
            const song = createMockSong({ Name: 'Single Song' });
            const playable = toPlayableItem(song);

            expect(playable.id).toBe('song-123');
            expect(playable.title).toBe('Single Song');
            expect(playable.mediaType).toBe('Audio');
        });

        it('preserves song duration from RunTimeTicks', () => {
            const song = createMockSong({ RunTimeTicks: 3600000000 }); // 1 hour
            const playable = toPlayableItem(song);

            expect(playable.duration).toBe(360); // seconds
            expect(playable.runtimeTicks).toBe(3600000000);
        });

        it('extracts artist information from ArtistItems', () => {
            const song: BaseItemDto = {
                Id: 'song-1',
                Name: 'Song Title',
                ServerId: 'server-1',
                ArtistItems: [{ Name: 'Artist Name', Id: 'artist-1' }]
            };

            const playable = toPlayableItem(song);

            expect(playable.artist).toBe('Artist Name');
        });
    });

    describe('play all songs', () => {
        it('converts multiple songs to playable queue', () => {
            const songs = createMockSongs(10);
            const queue = toPlayableItems(songs);

            expect(queue).toHaveLength(10);
            queue.forEach((item, index) => {
                expect(item.id).toBe(`song-${index}`);
                expect(item.mediaType).toBe('Audio');
            });
        });

        it('maintains song order in queue', () => {
            const unorderedSongs: BaseItemDto[] = [
                createMockSong({ Id: 'song-3', Name: 'Third' }),
                createMockSong({ Id: 'song-1', Name: 'First' }),
                createMockSong({ Id: 'song-2', Name: 'Second' })
            ];

            const queue = toPlayableItems(unorderedSongs);

            expect(queue[0].id).toBe('song-3');
            expect(queue[1].id).toBe('song-1');
            expect(queue[2].id).toBe('song-2');
        });
    });

    describe('song metadata', () => {
        it('preserves album and album artist', () => {
            const song: BaseItemDto = {
                Id: 'song-1',
                Name: 'Test Song',
                ServerId: 'server-1',
                Album: 'Test Album',
                AlbumArtist: 'Album Artist'
            };

            const playable = toPlayableItem(song);

            expect(playable.album).toBe('Test Album');
            expect(playable.artist).toBe('Album Artist');
        });

        it('handles songs with missing album artist but artist items', () => {
            const song = createMockSong({ AlbumArtist: undefined });
            const playable = toPlayableItem(song);

            // Should extract from ArtistItems
            expect(playable.artist).toBe('Test Artist');
        });

        it('handles songs with missing all artist info', () => {
            const song: BaseItemDto = {
                Id: 'song-1',
                Name: 'Unknown Artist Song',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(song);

            expect(playable.artist).toBeUndefined();
            expect(playable.title).toBe('Unknown Artist Song');
        });
    });

    describe('error handling', () => {
        it('handles songs with missing required fields', () => {
            const incompleteSong: BaseItemDto = {
                Name: 'Song without ID'
            };

            const playable = toPlayableItem(incompleteSong);

            expect(playable.id).toBe(''); // Default empty string
            expect(playable.title).toBe('Song without ID');
        });

        it('handles empty song list', () => {
            const queue = toPlayableItems([]);
            expect(queue).toEqual([]);
        });

        it('handles songs with zero duration', () => {
            const song = createMockSong({ RunTimeTicks: 0 });
            const playable = toPlayableItem(song);

            expect(playable.duration).toBeUndefined();
        });

        it('handles songs with undefined RunTimeTicks', () => {
            const song = createMockSong({ RunTimeTicks: undefined });
            const playable = toPlayableItem(song);

            expect(playable.duration).toBeUndefined();
            expect(playable.runtimeTicks).toBeUndefined();
        });
    });

    describe('queue context', () => {
        it('creates valid queue for single song play', () => {
            const song = createMockSong();
            const queue = [toPlayableItem(song)];

            expect(queue).toHaveLength(1);
            expect(queue[0].mediaType).toBe('Audio');
        });

        it('creates valid queue for play all', () => {
            const songs = createMockSongs(25);
            const queue = toPlayableItems(songs);

            expect(queue.length).toBe(25);
            queue.forEach(item => {
                expect(item.mediaType).toBe('Audio');
                expect(item.id).toBeTruthy();
            });
        });
    });
});
