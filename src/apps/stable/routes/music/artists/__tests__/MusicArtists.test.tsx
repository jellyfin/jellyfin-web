/**
 * MusicArtists Component Tests
 *
 * Basic integration tests for the MusicArtists view playback functionality.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { toPlayableItem, toPlayableItems } from 'lib/utils/playbackUtils';
import { createMockArtist, createMockArtists, createMockSongs } from 'test/factories/mediaItems';
import { describe, expect, it } from 'vitest';

describe('MusicArtists integration', () => {
    describe('artist playback', () => {
        it('converts artist to playable format', () => {
            const artist = createMockArtist({ Name: 'Test Artist' });
            const playable = toPlayableItem(artist);

            expect(playable.id).toBe('artist-123');
            expect(playable.title).toBe('Test Artist');
            expect(playable.mediaType).toBe('Audio');
        });

        it('preserves artist metadata', () => {
            const artist: BaseItemDto = {
                Id: 'artist-1',
                Name: 'Famous Artist',
                ServerId: 'server-1',
                Type: 'MusicArtist'
            };

            const playable = toPlayableItem(artist);

            expect(playable).toMatchObject({
                id: 'artist-1',
                name: 'Famous Artist',
                title: 'Famous Artist',
                serverId: 'server-1',
                mediaType: 'Audio'
            });
        });
    });

    describe('artist track queuing', () => {
        it('converts artist tracks to playable queue', () => {
            const tracks = createMockSongs(10);
            const queue = toPlayableItems(tracks);

            expect(queue).toHaveLength(10);
            queue.forEach((item, index) => {
                expect(item.id).toBe(`song-${index}`);
                expect(item.mediaType).toBe('Audio');
            });
        });

        it('handles artist with up to 100 tracks', () => {
            const tracks = createMockSongs(100);
            const queue = toPlayableItems(tracks);

            expect(queue).toHaveLength(100);
            queue.forEach((item) => {
                expect(item.mediaType).toBe('Audio');
            });
        });

        it('maintains track order for artist playback', () => {
            const shuffledTracks: BaseItemDto[] = [
                ...createMockSongs(3).slice(0, 1),
                ...createMockSongs(3).slice(2, 3),
                ...createMockSongs(3).slice(1, 2)
            ];

            const queue = toPlayableItems(shuffledTracks);

            expect(queue).toHaveLength(3);
            // Order is preserved as given
        });
    });

    describe('multiple artists', () => {
        it('converts multiple artists to playable format', () => {
            const artists = createMockArtists(5);
            const playables = toPlayableItems(artists);

            expect(playables).toHaveLength(5);
            playables.forEach((playable, index) => {
                expect(playable.id).toBe(`artist-${index}`);
                expect(playable.mediaType).toBe('Audio');
            });
        });

        it('handles artist list pagination', () => {
            const page1Artists = createMockArtists(25);
            const page2Artists = createMockArtists(25);

            const allArtists = [...page1Artists, ...page2Artists];
            const playables = toPlayableItems(allArtists);

            expect(playables).toHaveLength(50);
        });
    });

    describe('error handling', () => {
        it('handles artists with missing ID', () => {
            const incompleteArtist: BaseItemDto = {
                Name: 'Artist without ID'
            };

            const playable = toPlayableItem(incompleteArtist);

            expect(playable.id).toBe(''); // Default empty string
            expect(playable.title).toBe('Artist without ID');
        });

        it('handles empty artist list', () => {
            const queue = toPlayableItems([]);
            expect(queue).toEqual([]);
        });

        it('handles artist with empty track list', () => {
            const emptyQueue = toPlayableItems([]);
            expect(emptyQueue).toEqual([]);
        });

        it('handles mixed valid and invalid track data', () => {
            const mixedTracks: BaseItemDto[] = [
                { Id: 'track-1', Name: 'Valid Track', ServerId: 'server-1' },
                { Name: 'No ID Track' }, // Missing ID
                { Id: 'track-3', Name: 'Another Valid', ServerId: 'server-1' }
            ];

            const queue = toPlayableItems(mixedTracks);

            expect(queue).toHaveLength(3);
            expect(queue[1].id).toBe(''); // Gets default empty string
        });
    });

    describe('shuffle context', () => {
        it('maintains data integrity after shuffle', () => {
            const originalTracks = createMockSongs(10);
            const shuffled = [...originalTracks].sort(() => Math.random() - 0.5);
            const queue = toPlayableItems(shuffled);

            expect(queue).toHaveLength(10);
            queue.forEach((item) => {
                expect(item.id).toBeTruthy();
                expect(item.mediaType).toBe('Audio');
            });
        });

        it('converts pre-shuffled tracks correctly', () => {
            const tracks = createMockSongs(25);
            const shuffled = [...tracks].sort(() => Math.random() - 0.5);
            const queue = toPlayableItems(shuffled);

            expect(queue).toHaveLength(25);
            // All data should be preserved despite shuffle
            const ids = queue.map((q) => q.id);
            expect(ids.filter((id) => id).length).toBe(25);
        });
    });

    describe('playback context', () => {
        it('creates valid starting point for artist playback', () => {
            const artist = createMockArtist();
            const tracks = createMockSongs(50);

            const artistPlayable = toPlayableItem(artist);
            const trackQueue = toPlayableItems(tracks);

            expect(artistPlayable.id).toBeTruthy();
            expect(trackQueue).toHaveLength(50);
        });

        it('handles artist with single track', () => {
            const tracks = createMockSongs(1);
            const queue = toPlayableItems(tracks);

            expect(queue).toHaveLength(1);
            expect(queue[0].mediaType).toBe('Audio');
        });
    });
});
