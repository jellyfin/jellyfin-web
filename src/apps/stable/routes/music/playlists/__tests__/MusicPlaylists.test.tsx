/**
 * Music Playlists View Tests
 *
 * Integration tests for music playlists with playback functionality.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { toPlayableItem } from 'lib/utils/playbackUtils';
import { describe, expect, it } from 'vitest';

describe('Music Playlists integration', () => {
    describe('music playlist item playback conversion', () => {
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

        it('converts curated music playlist to playable format', () => {
            const playlist: BaseItemDto = {
                Id: 'curated-playlist-1',
                Name: 'Summer Hits 2024',
                Type: 'Playlist',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(playlist);

            expect(playable.id).toBe('curated-playlist-1');
            expect(playable.title).toBe('Summer Hits 2024');
        });

        it('converts workout music playlist to playable format', () => {
            const playlist: BaseItemDto = {
                Id: 'workout-playlist',
                Name: 'High Energy Workout',
                Type: 'Playlist',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(playlist);

            expect(playable.id).toBe('workout-playlist');
            expect(playable.title).toBe('High Energy Workout');
        });
    });

    describe('music playlist collection types', () => {
        it('handles music playlists from various genres', () => {
            const playlists: BaseItemDto[] = [
                { Id: 'rock-1', Name: 'Rock Classics', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'pop-1', Name: 'Pop Hits', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'jazz-1', Name: 'Jazz Standards', Type: 'Playlist', ServerId: 'server-1' },
                {
                    Id: 'hip-hop-1',
                    Name: 'Hip Hop Essentials',
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

        it('handles system/auto playlists', () => {
            const systemPlaylists: BaseItemDto[] = [
                {
                    Id: 'recently-added',
                    Name: 'Recently Added',
                    Type: 'Playlist',
                    ServerId: 'server-1'
                },
                { Id: 'most-played', Name: 'Most Played', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'favorites', Name: 'Favorites', Type: 'Playlist', ServerId: 'server-1' }
            ];

            systemPlaylists.forEach((playlist) => {
                const playable = toPlayableItem(playlist);
                expect(playable.id).toBeDefined();
                expect(playable.title).toBeDefined();
            });
        });

        it('handles large music playlist collections', () => {
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

        it('handles mood-based playlists', () => {
            const moodPlaylists: BaseItemDto[] = [
                { Id: 'chill-1', Name: 'Chill Vibes', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'energy-1', Name: 'High Energy', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'focus-1', Name: 'Deep Focus', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const playables = moodPlaylists.map(toPlayableItem);

            expect(playables).toHaveLength(3);
            playables.forEach((item) => {
                expect(item.title).toBeDefined();
            });
        });
    });

    describe('music playlist queuing', () => {
        it('queues individual music playlist for playback', () => {
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

        it('supports playing multiple music playlists in sequence', () => {
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

        it('preserves music playlist order in queue', () => {
            const playlists: BaseItemDto[] = [
                { Id: 'first', Name: 'First Playlist', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'second', Name: 'Second Playlist', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'third', Name: 'Third Playlist', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const queue = playlists.map(toPlayableItem);

            expect(queue[0].title).toBe('First Playlist');
            expect(queue[1].title).toBe('Second Playlist');
            expect(queue[2].title).toBe('Third Playlist');
        });

        it('handles queueing large number of music playlists', () => {
            const playlists: BaseItemDto[] = Array.from({ length: 100 }, (_, i) => ({
                Id: `music-p-${i}`,
                Name: `Music Playlist ${i + 1}`,
                Type: 'Playlist' as const,
                ServerId: 'server-1'
            }));

            const queue = playlists.map(toPlayableItem);

            expect(queue).toHaveLength(100);
            expect(queue[0].id).toBe('music-p-0');
            expect(queue[99].id).toBe('music-p-99');
        });

        it('handles browsing music playlist sections with playback', () => {
            const section = {
                title: 'Saved Playlists',
                items: Array.from({ length: 12 }, (_, i) => ({
                    Id: `saved-${i}`,
                    Name: `Saved Playlist ${i + 1}`,
                    Type: 'Playlist' as const,
                    ServerId: 'server-1'
                }))
            };

            const queue = section.items.slice(0, 12).map(toPlayableItem);

            expect(queue).toHaveLength(12);
            queue.forEach((item, index) => {
                expect(item.title).toBe(`Saved Playlist ${index + 1}`);
            });
        });
    });

    describe('error handling', () => {
        it('handles music playlists with missing optional metadata', () => {
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

        it('handles music playlist with special characters in name', () => {
            const playlist: BaseItemDto = {
                Id: 'special-chars',
                Name: 'My Playlist: Best Of (2024)',
                Type: 'Playlist',
                ServerId: 'server-1'
            };

            const playable = toPlayableItem(playlist);

            expect(playable.title).toBe('My Playlist: Best Of (2024)');
        });

        it('handles empty music playlist collection', () => {
            const emptyCollection: BaseItemDto[] = [];
            const queue = emptyCollection.map(toPlayableItem);

            expect(queue).toEqual([]);
        });

        it('handles music playlist with very long name', () => {
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

        it('preserves music playlist metadata for playback', () => {
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

    describe('music playlist sections', () => {
        it('handles user-created music playlists section', () => {
            const userPlaylists: BaseItemDto[] = [
                { Id: 'user-1', Name: 'My Workout Mix', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'user-2', Name: 'Road Trip', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'user-3', Name: 'Study Session', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const queue = userPlaylists.map(toPlayableItem);

            expect(queue).toHaveLength(3);
            queue.forEach((item, i) => {
                expect(item.id).toBe(`user-${i + 1}`);
            });
        });

        it('handles curated playlists section', () => {
            const curatedPlaylists: BaseItemDto[] = [
                {
                    Id: 'curated-1',
                    Name: 'Discover Weekly',
                    Type: 'Playlist',
                    ServerId: 'server-1'
                },
                { Id: 'curated-2', Name: 'Release Radar', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const queue = curatedPlaylists.map(toPlayableItem);

            expect(queue).toHaveLength(2);
        });

        it('handles recently played playlists', () => {
            const recentPlaylists: BaseItemDto[] = [
                {
                    Id: 'recent-1',
                    Name: 'Recently Played 1',
                    Type: 'Playlist',
                    ServerId: 'server-1'
                },
                {
                    Id: 'recent-2',
                    Name: 'Recently Played 2',
                    Type: 'Playlist',
                    ServerId: 'server-1'
                },
                {
                    Id: 'recent-3',
                    Name: 'Recently Played 3',
                    Type: 'Playlist',
                    ServerId: 'server-1'
                },
                {
                    Id: 'recent-4',
                    Name: 'Recently Played 4',
                    Type: 'Playlist',
                    ServerId: 'server-1'
                }
            ];

            const queue = recentPlaylists.map(toPlayableItem);

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

        it('handles paginated music playlist loading', () => {
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

    describe('music playlist types and sorting', () => {
        it('handles playlists sorted by name', () => {
            const playlists: BaseItemDto[] = [
                { Id: 'z-1', Name: 'Zen Meditation', Type: 'Playlist', ServerId: 'server-1' },
                {
                    Id: 'a-1',
                    Name: 'Action Movie Soundtracks',
                    Type: 'Playlist',
                    ServerId: 'server-1'
                },
                { Id: 'm-1', Name: 'Morning Drive', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const playables = playlists.map(toPlayableItem);
            expect(playables).toHaveLength(3);
        });

        it('handles playlists sorted by date created', () => {
            const playlists: BaseItemDto[] = [
                { Id: 'old-1', Name: 'Oldest Playlist', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'mid-1', Name: 'Middle Playlist', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'new-1', Name: 'Newest Playlist', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const playables = playlists.map(toPlayableItem);
            expect(playables).toHaveLength(3);
        });

        it('handles playlists sorted by date modified', () => {
            const playlists: BaseItemDto[] = [
                {
                    Id: 'mod-1',
                    Name: 'Recently Modified 1',
                    Type: 'Playlist',
                    ServerId: 'server-1'
                },
                { Id: 'mod-2', Name: 'Recently Modified 2', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const playables = playlists.map(toPlayableItem);
            expect(playables).toHaveLength(2);
        });

        it('handles playlists sorted by song count', () => {
            const playlists: BaseItemDto[] = [
                { Id: 'large-1', Name: '100+ Songs', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'medium-1', Name: '50+ Songs', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'small-1', Name: '10 Songs', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const playables = playlists.map(toPlayableItem);
            expect(playables).toHaveLength(3);
        });

        it('handles playlists sorted by play count', () => {
            const playlists: BaseItemDto[] = [
                { Id: 'popular-1', Name: 'Most Played', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'moderate-1', Name: 'Often Played', Type: 'Playlist', ServerId: 'server-1' },
                { Id: 'rarely-1', Name: 'Rarely Played', Type: 'Playlist', ServerId: 'server-1' }
            ];

            const playables = playlists.map(toPlayableItem);
            expect(playables).toHaveLength(3);
        });
    });
});
