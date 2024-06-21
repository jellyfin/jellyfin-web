import { BaseItemKind, ImageType, ItemFields, MediaType, SortOrder } from '@jellyfin/sdk/lib/generated-client';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { CardOptions } from './cardOptions';
import { SectionsView } from './libraryTabContent';
import { HomeSectionType } from './homeSectionType';

export interface ParametersOptions {
    sortBy?: ItemSortBy[];
    sortOrder?: SortOrder[];
    includeItemTypes?: BaseItemKind[];
    mediaTypes?: MediaType[];
    fields?: ItemFields[];
    enableImageTypes?: ImageType[];
    recursive?: boolean;
    enableTotalRecordCount?: boolean;
    disableFirstEpisode?: boolean;
    nextUpDateCutoff?: string;
    enableResumable?: boolean;
    enableRewatching?: boolean;
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
    ResumeItems = 'resumeitems',
    LatestMedia = 'latestmedia',
    NextUp = 'nextup',
    RecommendedPrograms = 'recommendedprograms',
    LiveTvPrograms = 'livetvprograms',
    Recordings = 'recordings',
    RecordingFolders = 'recordingfolders',
    UserViews = 'userviews'
}

export enum SuggestionSectionType {
    ContinueWatchingMovies = 'continuewatchingmovies',
    LatestMovies = 'latestmovies',
    ContinueWatchingEpisode = 'continuewatchingepisode',
    LatestEpisode = 'latestepisode',
    NextUp = 'nextup',
    LatestMusic = 'latestmusic',
    RecentlyPlayedMusic = 'recentlyplayedmusic',
    FrequentlyPlayedMusic = 'frequentlyplayedmusic',
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
    UpcomingRecordings = 'upcomingrecordings',
}

export type SectionType = SuggestionSectionType | ProgramSectionType | HomeSectionType;

export interface Section {
    name: string;
    type: SectionType;
    apiMethod?: SectionApiMethod;
    itemTypes: string;
    parametersOptions?: ParametersOptions;
    cardOptions?: CardOptions;
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
