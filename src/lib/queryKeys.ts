/**
 * TanStack Query Keys
 *
 * Centralized query key definitions for consistent cache management.
 */

export const queryKeys = {
    // Items - Core queries
    items: (parentId?: string, options?: ItemsQueryOptions) =>
        ['items', parentId, JSON.stringify(options)].filter(Boolean),

    item: (id: string) => ['item', id] as const,

    itemsByName: (name: string, parentId?: string) => ['items', 'byName', name, parentId].filter(Boolean),

    resumeItems: (type?: string) => ['resume', type].filter(Boolean),

    recentItems: (parentId?: string, type?: string, limit = 10) => ['recent', parentId, type, limit].filter(Boolean),

    latestItems: (parentId?: string, type?: string) => ['latest', parentId, type].filter(Boolean),

    // Collections
    collections: (parentId?: string) => ['collections', parentId].filter(Boolean),

    collection: (id: string) => ['collection', id] as const,
    collectionItems: (id: string) => ['collection', id, 'items'] as const,

    // Genres
    genres: (type: string, parentId?: string) => ['genres', type, parentId].filter(Boolean),

    // Artists (music)
    artists: (params?: Record<string, unknown>) => ['artists', JSON.stringify(params)].filter(Boolean),

    artist: (id: string) => ['artist', id] as const,
    artistAlbums: (id: string) => ['artist', id, 'albums'] as const,

    // Albums (music)
    albums: (params?: Record<string, unknown>) => ['albums', JSON.stringify(params)].filter(Boolean),

    // Songs (music)
    songs: (params?: Record<string, unknown>) => ['songs', JSON.stringify(params)].filter(Boolean),

    // Movies
    movies: (params?: Record<string, unknown>) => ['movies', JSON.stringify(params)].filter(Boolean),

    movieRecommendations: (id?: string) => ['movieRecommendations', id].filter(Boolean),

    recommendedMovies: (parentId?: string) => ['recommendedMovies', parentId].filter(Boolean),

    // TV Shows
    tvShows: (params?: Record<string, unknown>) => ['tvShows', JSON.stringify(params)].filter(Boolean),

    nextUp: (params?: Record<string, unknown>) => ['nextUp', JSON.stringify(params)].filter(Boolean),

    episodes: (seriesId?: string, seasonId?: string) => ['episodes', seriesId, seasonId].filter(Boolean),

    seasons: (seriesId: string) => ['seasons', seriesId] as const,
    seasonEpisodes: (seriesId: string, seasonId: string) => ['seasons', seriesId, seasonId, 'episodes'] as const,

    // User
    userViews: ['user', 'views'] as const,
    user: ['user'] as const,
    userFavorites: (userId?: string) => ['user', userId, 'favorites'].filter(Boolean),

    // Servers
    servers: ['servers'] as const,
    serverConfig: (id: string) => ['server', id] as const,

    // Filters
    filterOptions: (params: Record<string, unknown>) => ['filterOptions', JSON.stringify(params)].filter(Boolean),

    // People
    person: (id: string) => ['person', id] as const,
    personItems: (id: string, type?: string) => ['person', id, type].filter(Boolean),

    // Studios
    studios: (params?: Record<string, unknown>) => ['studios', JSON.stringify(params)].filter(Boolean),
    studio: (id: string) => ['studio', id] as const,
    studioItems: (id: string) => ['studio', id, 'items'] as const,

    // Playlists
    playlists: (params?: Record<string, unknown>) => ['playlists', JSON.stringify(params)].filter(Boolean),
    playlistItems: (id: string) => ['playlist', id, 'items'] as const,

    // Live TV
    liveTvChannels: (params?: Record<string, unknown>) =>
        ['liveTv', 'channels', JSON.stringify(params)].filter(Boolean),
    liveTvPrograms: (params: Record<string, unknown>) => ['liveTv', 'programs', JSON.stringify(params)].filter(Boolean),
    liveTvGuide: ['liveTv', 'guide'] as const
};

export interface ItemsQueryOptions {
    includeTypes?: string[];
    sortBy?: string;
    sortOrder?: 'Ascending' | 'Descending';
    filters?: string[];
    searchTerm?: string;
    startIndex?: number;
    limit?: number;
    recursive?: boolean;
    imageTypeLimit?: number;
    enableImageTypes?: string[];
    genres?: string[];
    genreIds?: string[];
    years?: number[];
    studios?: string[];
    genresMode?: string;
    parentId?: string;
    artistIds?: string[];
}

export interface ArtistsQueryParams {
    parentId?: string;
    searchTerm?: string;
    startIndex?: number;
    limit?: number;
    recursive?: boolean;
    sortBy?: string;
    sortOrder?: 'Ascending' | 'Descending';
}

export interface AlbumsQueryParams {
    parentId?: string;
    artistId?: string;
    searchTerm?: string;
    startIndex?: number;
    limit?: number;
    recursive?: boolean;
    sortBy?: string;
    sortOrder?: 'Ascending' | 'Descending';
    filters?: string[];
}

export interface MoviesQueryParams {
    parentId?: string;
    searchTerm?: string;
    genreId?: string;
    studioId?: string;
    year?: number;
    startIndex?: number;
    limit?: number;
    recursive?: boolean;
    sortBy?: string;
    sortOrder?: 'Ascending' | 'Descending';
    filters?: string[];
}

export interface TVShowsQueryParams {
    parentId?: string;
    searchTerm?: string;
    genreId?: string;
    studioId?: string;
    year?: number;
    startIndex?: number;
    limit?: number;
    recursive?: boolean;
    sortBy?: string;
    sortOrder?: 'Ascending' | 'Descending';
    filters?: string[];
}
