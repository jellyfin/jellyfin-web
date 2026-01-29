/**
 * MusicAlbums Component Tests
 *
 * Basic integration tests for the MusicAlbums view playback functionality.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { toPlayableItem, toPlayableItems } from 'lib/utils/playbackUtils';
import { createMockAlbum, createMockAlbums } from 'test/factories/mediaItems';
import { describe, expect, it } from 'vitest';

describe('MusicAlbums integration', () => {
    describe('playback conversion', () => {
        it('converts albums to playable format', () => {
            const albums = createMockAlbums(3);
            const playables = toPlayableItems(albums);

            expect(playables).toHaveLength(3);
            playables.forEach((playable, index) => {
                expect(playable.id).toBe(`album-${index}`);
                expect(playable.title).toBe(`Album ${index}`);
                expect(playable.mediaType).toBe('Audio');
            });
        });

        it('converts single album to playable format', () => {
            const album = createMockAlbum({ Name: 'Single Album' });
            const playable = toPlayableItem(album);

            expect(playable.id).toBe('album-123');
            expect(playable.title).toBe('Single Album');
            expect(playable.serverId).toBe('server-1');
            expect(playable.mediaType).toBe('Audio');
        });

        it('handles albums with missing album artist', () => {
            const album = createMockAlbum({ AlbumArtist: undefined, ArtistItems: undefined });
            const playable = toPlayableItem(album);

            expect(playable.artist).toBeUndefined();
            expect(playable.title).toBeTruthy();
        });

        it('preserves album metadata', () => {
            const album: BaseItemDto = {
                Id: 'album-1',
                Name: 'Test Album',
                ServerId: 'server-1',
                AlbumArtist: 'Test Artist',
                ProductionYear: 2024,
                Type: 'MusicAlbum'
            };

            const playable = toPlayableItem(album);

            expect(playable).toMatchObject({
                id: 'album-1',
                name: 'Test Album',
                title: 'Test Album',
                artist: 'Test Artist',
                year: 2024,
                serverId: 'server-1',
                mediaType: 'Audio'
            });
        });
    });

    describe('playback queue generation', () => {
        it('generates single-item queue for album playback', () => {
            const album = createMockAlbum();
            const queue = [toPlayableItem(album)];

            expect(queue).toHaveLength(1);
            expect(queue[0].id).toBe('album-123');
        });

        it('generates multi-item queue for multiple albums', () => {
            const albums = createMockAlbums(5);
            const queue = toPlayableItems(albums);

            expect(queue).toHaveLength(5);
            queue.forEach((item, index) => {
                expect(item.id).toBe(`album-${index}`);
            });
        });

        it('maintains order of albums in queue', () => {
            const unorderedAlbums: BaseItemDto[] = [
                createMockAlbum({ Id: 'album-c', Name: 'C Album' }),
                createMockAlbum({ Id: 'album-a', Name: 'A Album' }),
                createMockAlbum({ Id: 'album-b', Name: 'B Album' })
            ];

            const queue = toPlayableItems(unorderedAlbums);

            expect(queue[0].id).toBe('album-c');
            expect(queue[1].id).toBe('album-a');
            expect(queue[2].id).toBe('album-b');
        });
    });

    describe('error handling', () => {
        it('handles albums with missing required fields', () => {
            const incompleteAlbum: BaseItemDto = { Name: 'No ID Album' };
            const playable = toPlayableItem(incompleteAlbum);

            expect(playable.id).toBe(''); // Uses default empty string
            expect(playable.title).toBe('No ID Album');
        });

        it('handles empty album array', () => {
            const queue = toPlayableItems([]);
            expect(queue).toEqual([]);
        });
    });
});
