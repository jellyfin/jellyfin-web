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
    Persons = 'persons'
}

export enum SuggestionSectionType {
    ContinueWatchingMovies = 'continuewatchingmovies',
    LatestMovies = 'latestmovies',
    ContinueWatchingEpisode = 'continuewatchingepisode',
    LatestEpisode = 'latestepisode',
    NextUp = 'nextup',
    LatestMusic = 'latestmusic',
    RecentlyPlayedMusic = 'recentlyplayedmusic',
    FrequentlyPlayedMusic = 'frequentlyplayedmusic'
}

export enum ProgramSectionType {
    ActivePrograms = 'activeprograms',
    UpcomingEpisodes = 'upcomingepisodes',
    UpcomingMovies = 'upcomingmovies',
    UpcomingSports = 'upcomingsports',
    UpcomingKids = 'upcomingkids',
    UpcomingNews = 'upcomingnews',
    LatestRecordings = 'latestrecordings',
    RecordingFolders = 'recordingfolders',
    ActiveRecordings = 'activerecordings',
    UpcomingRecordings = 'upcomingrecordings'
}

export enum FavoriteSectionType {
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
    FavoriteBooks = 'favoriteBooks'
}

export type SectionType = SuggestionSectionType | ProgramSectionType | FavoriteSectionType;

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
        SuggestionSectionType.ContinueWatchingMovies,
        SuggestionSectionType.LatestMovies
    ],
    isMovieRecommendations: true
};

export const TvShowSuggestionsSectionsView: SectionsView = {
    suggestionSections: [
        SuggestionSectionType.ContinueWatchingEpisode,
        SuggestionSectionType.LatestEpisode,
        SuggestionSectionType.NextUp
    ]
};

export const MusicSuggestionsSectionsView: SectionsView = {
    suggestionSections: [
        SuggestionSectionType.LatestMusic,
        SuggestionSectionType.FrequentlyPlayedMusic,
        SuggestionSectionType.RecentlyPlayedMusic
    ]
};

export const ProgramSectionsView: SectionsView = {
    programSections: [
        ProgramSectionType.ActivePrograms,
        ProgramSectionType.UpcomingEpisodes,
        ProgramSectionType.UpcomingMovies,
        ProgramSectionType.UpcomingSports,
        ProgramSectionType.UpcomingKids,
        ProgramSectionType.UpcomingNews
    ]
};

export const RecordingsSectionsView: SectionsView = {
    programSections: [
        ProgramSectionType.LatestRecordings,
        ProgramSectionType.RecordingFolders
    ]
};

export const ScheduleSectionsView: SectionsView = {
    programSections: [ProgramSectionType.ActiveRecordings],
    isLiveTvUpcomingRecordings: true
};
