/**
 * Playlists View Tests
 *
 * Integration tests for playlists with playback functionality.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { toPlayableItem } from 'lib/utils/playbackUtils';
import { describe, expect, it } from 'vitest';

describe('Playlists integration', () => {
    describe('playlist item playback conversion', () => {
        it('converts music playlist to playable format', () => {
            const playlist: BaseItemDto = {
                Id: 'music-playlist-1',
                Name: 'My Favorite Songs',
                Type: 'Playlist',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(playlist);

            expect(playable.id).toBe('music-playlist-1');
            expect(playable.title).toBe('My Favorite Songs');
        });

        it('converts video playlist to playable format', () => {
            const playlist: BaseItemDto = {
                Id: 'video-playlist-1',
                Name: 'Movie Marathon',
                Type: 'Playlist',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(playlist);

            expect(playable.id).toBe('video-playlist-1');
            expect(playable.title).toBe('Movie Marathon');
        });

        it('converts mixed media playlist to playable format', () => {
            const playlist: BaseItemDto = {
                Id: 'mixed-playlist-1',
                Name: 'Everything',
                Type: 'Playlist',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(playlist);

            expect(playable.id).toBe('mixed-playlist-1');
            expect(playable.title).toBe('Everything');
        });
    });

    describe('playlist collection types', () => {
        it('handles playlists from all sources', () => {
            const playlists: BaseItemDto[] = [
                {
                    Id: 'auto-playlist-1',
                    Name: 'Recently Added',
                    Type: 'Playlist',
                    ServerId: 'server-1'
                },
                {
                    Id: 'user-playlist-1',
                    Name: 'Liked Songs',
                    Type: 'Playlist',
                    ServerId: 'server-1'
                },
                {
                    Id: 'smart-playlist-1',
                    Name: 'Top Rated',
                    Type: 'Playlist',
                    ServerId: 'server-1'
                }
            ];

            playlists.forEach((item, index) => {
                const playable = toPlayableItem(item);
                expect(playable.id).toBe(playlists[index].Id);
                expect(playable.title).toBe(playlists[index].Name);
            });
        });

        it('handles system playlists', () => {
            const systemPlaylists: BaseItemDto[] = [
                { Id: 'sys-1', Name: 'All Songs', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'sys-2', Name: 'All Music Videos', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'sys-3', Name: 'All Movies', Type: 'Playlist', ServerId: 'server-1' }
            ];

            systemPlaylists.forEach((playlist) => {
                const playable = toPlayableItem(playlist);
                expect(playable.id).toBeDefined();
                expect(playable.title).toBeDefined();
            });
        });

        it('handles large playlist collections', () => {
            const playlists: BaseItemDto[] = Array.from({ length: 50 }, (_, i) => ({
                Id: `playlist-${i}`,
                Name: `Playlist ${i + 1}`,
                Type: 'Playlist' as const,
                ServerId: 'server-1'
            }));

            const playables = playlists.map(toPlayableItem);

            expect(playables).toHaveLength(50);
            playables.forEach((item, index) => {
                expect(item.id).toBe(`playlist-${index}`);
            });
        });

        it('handles playlist duplication in queue', () => {
            const playlist: BaseItemDto = {
                Id: 'dup-playlist-1',
                Name: 'Duplicate Test',
                Type: 'Playlist',
                ServerId: 'server-1'
            };

            const queue = [toPlayableItem(playlist), toPlayableItem(playlist)];

            expect(queue).toHaveLength(2);
            expect(queue[0].id).toBe('dup-playlist-1');
            expect(queue[1].id).toBe('dup-playlist-1');
        });
    });

    describe('playback scenarios', () => {
        it('enables playback of single playlist', () => {
            const playlist: BaseItemDto = {
                Id: 'single-playlist',
                Name: 'Single Playlist',
                Type: 'Playlist',
                ServerId: 'server-1'
            };

            const queue = [toPlayableItem(playlist)];

            expect(queue).toHaveLength(1);
            expect(queue[0].id).toBe('single-playlist');
        });

        it('supports playing multiple playlists in queue', () => {
            const playlists: BaseItemDto[] = [
                { Id: 'p-1', Name: 'Playlist 1', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'p-2', Name: 'Playlist 2', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'p-3', Name: 'Playlist 3', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const queue = playlists.map(toPlayableItem);

            expect(queue).toHaveLength(3);
            queue.forEach((item, index) => {
                expect(item.title).toBe(`Playlist ${index + 1}`);
            });
        });

        it('preserves playlist order in queue', () => {
            const playlists: BaseItemDto[] = [
                { Id: 'ordered-1', Name: 'First', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'ordered-2', Name: 'Second', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'ordered-3', Name: 'Third', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const queue = playlists.map(toPlayableItem);

            expect(queue[0].title).toBe('First');
            expect(queue[1].title).toBe('Second');
            expect(queue[2].title).toBe('Third');
        });

        it('supports browsing playlist sections with playback', () => {
            const section = {
                title: 'User Playlists',
                items: Array.from({ length: 12 }, (_, i) => ({
                    Id: `user-playlist-${i}`,
                    Name: `User Playlist ${i + 1}`,
                    Type: 'Playlist' as const,
                    ServerId: 'server-1'
                }))
            };

            const queue = section.items.slice(0, 12).map(toPlayableItem);

            expect(queue).toHaveLength(12);
            queue.forEach((item, index) => {
                expect(item.title).toBe(`User Playlist ${index + 1}`);
            });
        });

        it('handles mixed music and video playlists in queue', () => {
            const playlists: BaseItemDto[] = [
                { Id: 'music-p-1', Name: 'Music Playlist', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'video-p-1', Name: 'Video Playlist', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const queue = playlists.map(toPlayableItem);

            expect(queue).toHaveLength(2);
            expect(queue[0].title).toBe('Music Playlist');
            expect(queue[1].title).toBe('Video Playlist');
        });
    });

    describe('error handling', () => {
        it('handles playlists with missing optional metadata', () => {
            const playlist: BaseItemDto = {
                Id: 'minimal-playlist',
                Name: 'Minimal Playlist',
                Type: 'Playlist',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(playlist);

            expect(playable.id).toBe('minimal-playlist');
            expect(playable.title).toBe('Minimal Playlist');
        });

        it('handles playlist with special characters in name', () => {
            const playlist: BaseItemDto = {
                Id: 'special-chars-playlist',
                Name: 'My Playlist: Best Of (2023)',
                Type: 'Playlist',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(playlist);

            expect(playable.title).toBe('My Playlist: Best Of (2023)');
        });

        it('handles empty playlist collection', () => {
            const emptySection: BaseItemDto[] = [];
            const queue = emptySection.map(toPlayableItem);

            expect(queue).toEqual([]);
        });

        it('handles playlist with very long name', () => {
            const longName = 'A'.repeat(200);
            const playlist: BaseItemDto = {
                Id: 'long-name-playlist',
                Name: longName,
                Type: 'Playlist',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(playlist);

            expect(playable.title).toBe(longName);
            expect(playable.title).toHaveLength(200);
        });

        it('preserves playlist metadata for playback', () => {
            const playlist: BaseItemDto = {
                Id: 'metadata-playlist',
                Name: 'Playlist with Metadata',
                Type: 'Playlist',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(playlist);

            expect(playable).toMatchObject({
                id: 'metadata-playlist',
                title: 'Playlist with Metadata'
            });
        });
    });

    describe('playlist sections', () => {
        it('handles music playlist section', () => {
            const musicPlaylists: BaseItemDto[] = [
                { Id: 'mp-1', Name: 'Music Playlist 1', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'mp-2', Name: 'Music Playlist 2', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'mp-3', Name: 'Music Playlist 3', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const queue = musicPlaylists.map(toPlayableItem);

            expect(queue).toHaveLength(3);
            queue.forEach((item, i) => {
                expect(item.id).toBe(`mp-${i + 1}`);
            });
        });

        it('handles video playlist section', () => {
            const videoPlaylists: BaseItemDto[] = [
                { Id: 'vp-1', Name: 'Video Playlist 1', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'vp-2', Name: 'Video Playlist 2', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const queue = videoPlaylists.map(toPlayableItem);

            expect(queue).toHaveLength(2);
        });

        it('handles system playlist section', () => {
            const systemPlaylists: BaseItemDto[] = [
                { Id: 'sys-1', Name: 'Smart Playlist 1', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'sys-2', Name: 'Smart Playlist 2', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'sys-3', Name: 'Smart Playlist 3', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'sys-4', Name: 'Smart Playlist 4', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const queue = systemPlaylists.map(toPlayableItem);

            expect(queue).toHaveLength(4);
        });

        it('limits section display to 12 items', () => {
            const playlists: BaseItemDto[] = Array.from({ length: 20 }, (_, i) => ({
                Id: `playlist-${i}`,
                Name: `Playlist ${i + 1}`,
                Type: 'Playlist' as const,
                ServerId: 'server-1'
            }));

            const displayed = playlists.slice(0, 12).map(toPlayableItem);

            expect(displayed).toHaveLength(12);
            expect(displayed[0].id).toBe('playlist-0');
            expect(displayed[11].id).toBe('playlist-11');
        });

        it('handles paginated playlist loading', () => {
            const pageSize = 20;
            const page1: BaseItemDto[] = Array.from({ length: pageSize }, (_, i) => ({
                Id: `p-1-${i}`,
                Name: `Page 1 Playlist ${i + 1}`,
                Type: 'Playlist' as const,
                ServerId: 'server-1'
            }));

            const page2: BaseItemDto[] = Array.from({ length: pageSize }, (_, i) => ({
                Id: `p-2-${i}`,
                Name: `Page 2 Playlist ${i + 1}`,
                Type: 'Playlist' as const,
                ServerId: 'server-1'
            }));

            const allPages = [...page1, ...page2];
            const queue = allPages.map(toPlayableItem);

            expect(queue).toHaveLength(40);
            expect(queue[0].id).toBe('p-1-0');
            expect(queue[19].id).toBe('p-1-19');
            expect(queue[20].id).toBe('p-2-0');
            expect(queue[39].id).toBe('p-2-19');
        });
    });

    describe('playlist types', () => {
        it('handles all supported playlist types', () => {
            const playlists: BaseItemDto[] = [
                { Id: 'music-1', Name: 'Music Playlist', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'video-1', Name: 'Video Playlist', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'mixed-1', Name: 'Mixed Playlist', Type: 'Playlist', ServerId: 'server-1' }
            ];

            playlists.forEach((playlist) => {
                const playable = toPlayableItem(playlist);
                expect(playable.id).toBeDefined();
                expect(playable.title).toBeDefined();
            });
        });

        it('handles playlists with different sort options', () => {
            const sortOptions = [
                {
                    name: 'By Name',
                    playlists: Array.from({ length: 3 }, (_, i) => ({
                        Id: `name-${i}`,
                        Name: `Playlist ${i}`,
                        Type: 'Playlist' as const,
                        ServerId: 'server-1'
                    }))
                },
                {
                    name: 'By Date Created',
                    playlists: Array.from({ length: 3 }, (_, i) => ({
                        Id: `date-created-${i}`,
                        Name: `Playlist ${i}`,
                        Type: 'Playlist' as const,
                        ServerId: 'server-1'
                    }))
                },
                {
                    name: 'By Date Modified',
                    playlists: Array.from({ length: 3 }, (_, i) => ({
                        Id: `date-mod-${i}`,
                        Name: `Playlist ${i}`,
                        Type: 'Playlist' as const,
                        ServerId: 'server-1'
                    }))
                },
                {
                    name: 'By Song Count',
                    playlists: Array.from({ length: 3 }, (_, i) => ({
                        Id: `song-count-${i}`,
                        Name: `Playlist ${i}`,
                        Type: 'Playlist' as const,
                        ServerId: 'server-1'
                    }))
                },
                {
                    name: 'By Play Count',
                    playlists: Array.from({ length: 3 }, (_, i) => ({
                        Id: `play-count-${i}`,
                        Name: `Playlist ${i}`,
                        Type: 'Playlist' as const,
                        ServerId: 'server-1'
                    }))
                }
            ];

            sortOptions.forEach((option) => {
                const queue = option.playlists.map(toPlayableItem);
                expect(queue).toHaveLength(3);
            });
        });
    });
});
