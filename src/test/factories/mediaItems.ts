/**
 * Media Items Test Factories
 *
 * Factory functions for creating mock media items for testing.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

export const createMockAlbum = (overrides?: Partial<BaseItemDto>): BaseItemDto => ({
    Id: 'album-123',
    Name: 'Test Album',
    Type: 'MusicAlbum',
    MediaType: 'Audio',
    ServerId: 'server-1',
    AlbumArtist: 'Test Artist',
    ProductionYear: 2024,
    ImageTags: { Primary: 'image-tag' },
    ...overrides
});

export const createMockSong = (overrides?: Partial<BaseItemDto>): BaseItemDto => ({
    Id: 'song-123',
    Name: 'Test Song',
    Type: 'Audio',
    MediaType: 'Audio',
    ServerId: 'server-1',
    Album: 'Test Album',
    AlbumArtist: 'Test Artist',
    ArtistItems: [{ Name: 'Test Artist', Id: 'artist-123' }],
    RunTimeTicks: 1800000000, // 3 minutes
    ...overrides
});

export const createMockArtist = (overrides?: Partial<BaseItemDto>): BaseItemDto => ({
    Id: 'artist-123',
    Name: 'Test Artist',
    Type: 'MusicArtist',
    ServerId: 'server-1',
    ImageTags: { Primary: 'artist-image' },
    ...overrides
});

export const createMockAlbums = (count: number): BaseItemDto[] =>
    Array.from({ length: count }, (_, i) =>
        createMockAlbum({ Id: `album-${i}`, Name: `Album ${i}` })
    );

export const createMockSongs = (count: number): BaseItemDto[] =>
    Array.from({ length: count }, (_, i) =>
        createMockSong({ Id: `song-${i}`, Name: `Song ${i}` })
    );

export const createMockArtists = (count: number): BaseItemDto[] =>
    Array.from({ length: count }, (_, i) =>
        createMockArtist({ Id: `artist-${i}`, Name: `Artist ${i}` })
    );

// Video item factories

export const createMockMovie = (overrides?: Partial<BaseItemDto>): BaseItemDto => ({
    Id: 'movie-123',
    Name: 'Test Movie',
    Type: 'Movie',
    MediaType: 'Video',
    ServerId: 'server-1',
    ProductionYear: 2024,
    RunTimeTicks: 7200000000, // 2 hours
    ImageTags: { Primary: 'movie-image' },
    OfficialRating: 'PG-13',
    ...overrides
});

export const createMockShow = (overrides?: Partial<BaseItemDto>): BaseItemDto => ({
    Id: 'show-123',
    Name: 'Test Show',
    Type: 'Series',
    MediaType: 'Video',
    ServerId: 'server-1',
    ProductionYear: 2024,
    ImageTags: { Primary: 'show-image' },
    ...overrides
});

export const createMockEpisode = (overrides?: Partial<BaseItemDto>): BaseItemDto => ({
    Id: 'episode-123',
    Name: 'Test Episode',
    Type: 'Episode',
    MediaType: 'Video',
    ServerId: 'server-1',
    SeriesName: 'Test Show',
    ParentIndexNumber: 1, // Season
    IndexNumber: 1, // Episode number
    RunTimeTicks: 2700000000, // 45 minutes
    ImageTags: { Primary: 'episode-image' },
    ...overrides
});

export const createMockMusicVideo = (overrides?: Partial<BaseItemDto>): BaseItemDto => ({
    Id: 'musicvideo-123',
    Name: 'Test Music Video',
    Type: 'MusicVideo',
    MediaType: 'Video',
    ServerId: 'server-1',
    AlbumArtist: 'Test Artist',
    Album: 'Test Album',
    RunTimeTicks: 3600000000, // 1 hour
    ImageTags: { Primary: 'mvideo-image' },
    ...overrides
});

export const createMockMovies = (count: number): BaseItemDto[] =>
    Array.from({ length: count }, (_, i) =>
        createMockMovie({ Id: `movie-${i}`, Name: `Movie ${i}` })
    );

export const createMockShows = (count: number): BaseItemDto[] =>
    Array.from({ length: count }, (_, i) =>
        createMockShow({ Id: `show-${i}`, Name: `Show ${i}` })
    );

export const createMockEpisodes = (count: number, seriesName = 'Test Show'): BaseItemDto[] =>
    Array.from({ length: count }, (_, i) =>
        createMockEpisode({ Id: `episode-${i}`, Name: `Episode ${i}`, SeriesName: seriesName })
    );

export const createMockMusicVideos = (count: number): BaseItemDto[] =>
    Array.from({ length: count }, (_, i) =>
        createMockMusicVideo({ Id: `musicvideo-${i}`, Name: `Music Video ${i}` })
    );
