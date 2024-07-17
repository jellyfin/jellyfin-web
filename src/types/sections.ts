import { BaseItemKind, SortOrder } from '@jellyfin/sdk/lib/generated-client';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { CardOptions } from './cardOptions';
import { SectionsView } from './libraryTabContent';

export interface ParametersOptions {
    sortBy?: ItemSortBy[];
    sortOrder?: SortOrder[];
    includeItemTypes?: BaseItemKind[];
    isAiring?: boolean;
    hasAired?: boolean;
    isMovie?: boolean;
    isSports?: boolean;
    isKids?: boolean;
    isNews?: boolean;
    isSeries?: boolean;
    isInProgress?: boolean;
    IsActive?: boolean;
    IsScheduled?: boolean;
    limit?: number;
    imageTypeLimit?: number;
}

export enum SectionApiMethod {
    ResumeItems = 'resumeItems',
    LatestMedia = 'latestMedia',
    NextUp = 'nextUp',
    RecommendedPrograms = 'recommendedPrograms',
    LiveTvPrograms = 'liveTvPrograms',
    Recordings = 'recordings',
    RecordingFolders = 'recordingFolders',
    Artists = 'artists',
    Persons = 'persons',
}

export enum SectionType {
    ContinueWatchingMovies = 'continueWatchingMovies',
    LatestMovies = 'latestMovies',
    ContinueWatchingEpisode = 'continueWatchingEpisode',
    LatestEpisode = 'latestEpisode',
    NextUp = 'nextUp',
    LatestMusic = 'latestMusic',
    RecentlyPlayedMusic = 'recentlyPlayedMusic',
    FrequentlyPlayedMusic = 'frequentlyPlayedMusic',
    ActivePrograms = 'activePrograms',
    UpcomingEpisodes = 'upcomingEpisodes',
    UpcomingMovies = 'upcomingMovies',
    UpcomingSports = 'upcomingSports',
    UpcomingKids = 'upcomingKids',
    UpcomingNews = 'upcomingNews',
    LatestRecordings = 'latestRecordings',
    RecordingFolders = 'recordingFolders',
    ActiveRecordings = 'activeRecordings',
    UpcomingRecordings = 'upcomingRecordings',
    FavoriteMovies = 'favoriteMovies',
    FavoriteShows = 'favoriteShows',
    FavoriteEpisode = 'favoriteEpisode',
    FavoriteVideos = 'favoriteVideos',
    FavoriteCollections = 'favoriteCollections',
    FavoritePlaylists = 'favoritePlaylists',
    FavoritePeople = 'favoritePeople',
    FavoriteArtists = 'favoriteArtists',
    FavoriteAlbums = 'favoriteAlbums',
    FavoriteSongs = 'favoriteSongs',
    FavoriteBooks = 'favoriteBooks',
}

export interface Section {
    name: string;
    type: SectionType;
    apiMethod?: SectionApiMethod;
    itemTypes: string;
    parametersOptions?: ParametersOptions;
    cardOptions: CardOptions;
}

export const MovieSuggestionsSectionsView: SectionsView = {
    suggestionSections: [
        SectionType.ContinueWatchingMovies,
        SectionType.LatestMovies
    ],
    isMovieRecommendations: true
};

export const MovieFavoritesSectionsView: SectionsView = {
    favoriteSections: [
        SectionType.FavoriteMovies,
        SectionType.FavoriteCollections
    ]
};

export const TvShowSuggestionsSectionsView: SectionsView = {
    suggestionSections: [
        SectionType.ContinueWatchingEpisode,
        SectionType.LatestEpisode,
        SectionType.NextUp
    ]
};

export const TvShowFavoritesSectionsView: SectionsView = {
    favoriteSections: [
        SectionType.FavoriteShows,
        SectionType.FavoriteEpisode
    ]
};

export const MusicSuggestionsSectionsView: SectionsView = {
    suggestionSections: [
        SectionType.LatestMusic,
        SectionType.FrequentlyPlayedMusic,
        SectionType.RecentlyPlayedMusic
    ]
};

export const MusicFavoritesSectionsView: SectionsView = {
    favoriteSections: [
        SectionType.FavoriteArtists,
        SectionType.FavoriteAlbums,
        SectionType.FavoriteSongs
    ]
};

export const ProgramSectionsView: SectionsView = {
    programSections: [
        SectionType.ActivePrograms,
        SectionType.UpcomingEpisodes,
        SectionType.UpcomingMovies,
        SectionType.UpcomingSports,
        SectionType.UpcomingKids,
        SectionType.UpcomingNews
    ]
};

export const RecordingsSectionsView: SectionsView = {
    programSections: [
        SectionType.LatestRecordings,
        SectionType.RecordingFolders
    ]
};

export const ScheduleSectionsView: SectionsView = {
    programSections: [SectionType.ActiveRecordings],
    isLiveTvUpcomingRecordings: true
};
