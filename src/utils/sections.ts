import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { LocationType } from '@jellyfin/sdk/lib/generated-client/models/location-type';
import * as userSettings from 'scripts/settings/userSettings';
import { CardShape } from 'utils/card';
import { type Section, SectionApiMethod, ProgramSectionType, SuggestionSectionType, FavoriteSectionType } from 'types/sections';

export const getSuggestionSections = (): Section[] => {
    const parametersOptions = {
        fields: [ItemFields.PrimaryImageAspectRatio],
        filters: [ItemFilter.IsPlayed],
        IsPlayed: true,
        imageTypeLimit: 1,
        enableImageTypes: [
            ImageType.Primary,
            ImageType.Backdrop,
            ImageType.Thumb
        ],
        recursive: true,
        limit: 25,
        enableTotalRecordCount: false
    };

    return [
        {
            name: 'HeaderContinueWatching',
            apiMethod: SectionApiMethod.ResumeItems,
            itemTypes: 'Movie',
            type: SuggestionSectionType.ContinueWatchingMovies,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Movie]
            },
            cardOptions: {
                overlayPlayButton: true,
                preferThumb: true,
                shape: CardShape.BackdropOverflow,
                showYear: true
            }
        },
        {
            name: 'HeaderLatestMovies',
            apiMethod: SectionApiMethod.LatestMedia,
            itemTypes: 'Movie',
            type: SuggestionSectionType.LatestMovies,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Movie]
            },
            cardOptions: {
                overlayPlayButton: true,
                shape: CardShape.PortraitOverflow,
                showYear: true
            }
        },
        {
            name: 'HeaderContinueWatching',
            apiMethod: SectionApiMethod.ResumeItems,
            itemTypes: 'Episode',
            type: SuggestionSectionType.ContinueWatchingEpisode,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Episode]
            },
            cardOptions: {
                overlayPlayButton: true,
                shape: CardShape.BackdropOverflow,
                preferThumb: true,
                inheritThumb:
                    !userSettings.useEpisodeImagesInNextUpAndResume(undefined),
                showYear: true
            }
        },
        {
            name: 'HeaderLatestEpisodes',
            apiMethod: SectionApiMethod.LatestMedia,
            itemTypes: 'Episode',
            type: SuggestionSectionType.LatestEpisode,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Episode]
            },
            cardOptions: {
                overlayPlayButton: true,
                shape: CardShape.BackdropOverflow,
                preferThumb: true,
                showSeriesYear: true,
                showParentTitle: true,
                showUnplayedIndicator: false,
                showChildCountIndicator: true,
                lines: 2
            }
        },
        {
            name: 'NextUp',
            apiMethod: SectionApiMethod.NextUp,
            itemTypes: 'nextup',
            type: SuggestionSectionType.NextUp,
            cardOptions: {
                overlayPlayButton: true,
                shape: CardShape.BackdropOverflow,
                preferThumb: true,
                inheritThumb:
                    !userSettings.useEpisodeImagesInNextUpAndResume(undefined),
                showParentTitle: true
            }
        },
        {
            name: 'HeaderLatestMusic',
            apiMethod: SectionApiMethod.LatestMedia,
            itemTypes: 'Audio',
            type: SuggestionSectionType.LatestMusic,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Audio]
            },
            cardOptions: {
                showUnplayedIndicator: false,
                shape: CardShape.SquareOverflow,
                showParentTitle: true,
                overlayPlayButton: true,
                coverImage: true
            }
        },
        {
            name: 'HeaderRecentlyPlayed',
            itemTypes: 'Audio',
            type: SuggestionSectionType.RecentlyPlayedMusic,
            parametersOptions: {
                sortBy: [ItemSortBy.DatePlayed],
                sortOrder: [SortOrder.Descending],
                includeItemTypes: [BaseItemKind.Audio],
                ...parametersOptions
            },
            cardOptions: {
                showUnplayedIndicator: false,
                shape: CardShape.SquareOverflow,
                showParentTitle: true,
                action: 'instantmix',
                overlayMoreButton: true,
                coverImage: true
            }
        },
        {
            name: 'HeaderFrequentlyPlayed',
            itemTypes: 'Audio',
            type: SuggestionSectionType.FrequentlyPlayedMusic,
            parametersOptions: {
                sortBy: [ItemSortBy.PlayCount],
                sortOrder: [SortOrder.Descending],
                includeItemTypes: [BaseItemKind.Audio],
                ...parametersOptions
            },
            cardOptions: {
                showUnplayedIndicator: false,
                shape: CardShape.SquareOverflow,
                showParentTitle: true,
                action: 'instantmix',
                overlayMoreButton: true,
                coverImage: true
            }
        }
    ];
};

export const getProgramSections = (): Section[] => {
    const cardOptions = {
        inheritThumb: false,
        shape: CardShape.AutoOverflow,
        defaultShape: CardShape.BackdropOverflow,
        centerText: true,
        coverImage: true,
        overlayText: false,
        lazy: true,
        showAirTime: true
    };

    return [
        {
            name: 'HeaderOnNow',
            itemTypes: 'Programs',
            apiMethod: SectionApiMethod.RecommendedPrograms,
            type: ProgramSectionType.ActivePrograms,
            parametersOptions: {
                isAiring: true
            },
            cardOptions: {
                showParentTitle: true,
                showTitle: true,
                showAirDateTime: false,
                showAirEndTime: true,
                overlayPlayButton: true,
                overlayMoreButton: false,
                overlayInfoButton: false,
                preferThumb: 'auto',
                ...cardOptions
            }
        },
        {
            name: 'Shows',
            itemTypes: 'Programs',
            apiMethod: SectionApiMethod.LiveTvPrograms,
            type: ProgramSectionType.UpcomingEpisodes,
            parametersOptions: {
                isAiring: false,
                hasAired: false,
                isMovie: false,
                isSports: false,
                isKids: false,
                isNews: false,
                isSeries: true
            },
            cardOptions: {
                showParentTitle: true,
                showTitle: true,
                overlayPlayButton: false,
                overlayMoreButton: false,
                overlayInfoButton: false,
                preferThumb: 'auto',
                showAirDateTime: true,
                ...cardOptions
            }
        },
        {
            name: 'Movies',
            itemTypes: 'Programs',
            apiMethod: SectionApiMethod.LiveTvPrograms,
            type: ProgramSectionType.UpcomingMovies,
            parametersOptions: {
                isAiring: false,
                hasAired: false,
                isMovie: true
            },
            cardOptions: {
                preferThumb: null,
                showParentTitle: false,
                showTitle: true,
                overlayPlayButton: false,
                overlayMoreButton: false,
                overlayInfoButton: false,
                showAirDateTime: true,
                ...cardOptions
            }
        },
        {
            name: 'Sports',
            itemTypes: 'Programs',
            apiMethod: SectionApiMethod.LiveTvPrograms,
            type: ProgramSectionType.UpcomingSports,
            parametersOptions: {
                isAiring: false,
                hasAired: false,
                isSports: true
            },
            cardOptions: {
                showParentTitle: true,
                showTitle: true,
                overlayPlayButton: false,
                overlayMoreButton: false,
                overlayInfoButton: false,
                preferThumb: 'auto',
                showAirDateTime: true,
                ...cardOptions
            }
        },
        {
            name: 'HeaderForKids',
            itemTypes: 'Programs',
            apiMethod: SectionApiMethod.LiveTvPrograms,
            type: ProgramSectionType.UpcomingKids,
            parametersOptions: {
                isAiring: false,
                hasAired: false,
                isKids: true
            },
            cardOptions: {
                showParentTitle: true,
                showTitle: true,
                overlayPlayButton: false,
                overlayMoreButton: false,
                overlayInfoButton: false,
                preferThumb: 'auto',
                showAirDateTime: true,
                ...cardOptions
            }
        },
        {
            name: 'News',
            itemTypes: 'Programs',
            apiMethod: SectionApiMethod.LiveTvPrograms,
            type: ProgramSectionType.UpcomingNews,
            parametersOptions: {
                isAiring: false,
                hasAired: false,
                isNews: true
            },
            cardOptions: {
                overlayPlayButton: false,
                overlayMoreButton: false,
                overlayInfoButton: false,
                showParentTitleOrTitle: true,
                showTitle: false,
                showParentTitle: false,
                preferThumb: 'auto',
                showAirDateTime: true,
                ...cardOptions
            }
        },
        {
            name: 'HeaderLatestRecordings',
            itemTypes: 'Recordings',
            apiMethod: SectionApiMethod.Recordings,
            type: ProgramSectionType.LatestRecordings,
            parametersOptions: {
                limit: 12,
                imageTypeLimit: 1
            },
            cardOptions: {
                showYear: true,
                lines: 2,
                shape: CardShape.AutoOverflow,
                defaultShape: CardShape.BackdropOverflow,
                showTitle: true,
                showParentTitle: true,
                coverImage: true,
                cardLayout: false,
                centerText: true,
                preferThumb: 'auto',
                overlayText: false
            }
        },
        {
            name: 'HeaderAllRecordings',
            itemTypes: 'Recordings',
            apiMethod: SectionApiMethod.RecordingFolders,
            type: ProgramSectionType.RecordingFolders,
            cardOptions: {
                showYear: false,
                showParentTitle: false,
                shape: CardShape.AutoOverflow,
                defaultShape: CardShape.BackdropOverflow,
                showTitle: true,
                coverImage: true,
                cardLayout: false,
                centerText: true,
                preferThumb: 'auto',
                overlayText: false
            }
        },
        {
            name: 'HeaderActiveRecordings',
            itemTypes: 'Recordings',
            apiMethod: SectionApiMethod.Recordings,
            type: ProgramSectionType.ActiveRecordings,
            parametersOptions: {
                isInProgress: true
            },
            cardOptions: {
                shape: CardShape.AutoOverflow,
                defaultShape: CardShape.Backdrop,
                showParentTitle: false,
                showParentTitleOrTitle: true,
                showTitle: true,
                showAirTime: true,
                showAirEndTime: true,
                showChannelName: true,
                coverImage: true,
                overlayText: false,
                overlayMoreButton: true,
                cardLayout: false,
                centerText: true,
                preferThumb: 'auto'
            }
        }
    ];
};

export const getFavoriteSections = (): Section[] => {
    const parametersOptions = {
        sortBy: [ItemSortBy.SortName],
        sortOrder: [SortOrder.Ascending],
        fields: [ItemFields.PrimaryImageAspectRatio],
        filters: [ItemFilter.IsFavorite],
        isFavorite: true,
        limit: 25,
        enableTotalRecordCount: false
    };

    const parametersExtraOptions = {
        collapseBoxSetItems: false,
        recursive: true,
        excludeLocationTypes: [LocationType.Virtual]
    };

    const cardOptions = {
        showTitle: true,
        overlayText: false,
        centerText: true,
        cardLayout: false
    };

    return [
        {
            name: 'HeaderFavoriteMovies',
            itemTypes: 'Movie',
            type: FavoriteSectionType.FavoriteMovies,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Movie],
                ...parametersOptions,
                ...parametersExtraOptions
            },
            cardOptions: {
                shape: CardShape.PortraitOverflow,
                showYear: true,
                overlayPlayButton: true,
                lines: 2,
                ...cardOptions
            }
        },
        {
            name: 'HeaderFavoriteShows',
            itemTypes: 'Series',
            type: FavoriteSectionType.FavoriteShows,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Series],
                ...parametersOptions,
                ...parametersExtraOptions
            },
            cardOptions: {
                shape: CardShape.PortraitOverflow,
                showYear: true,
                overlayPlayButton: true,
                lines: 2,
                ...cardOptions
            }
        },
        {
            name: 'HeaderFavoriteEpisodes',
            itemTypes: 'Episode',
            type: FavoriteSectionType.FavoriteEpisode,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Episode],
                ...parametersOptions,
                ...parametersExtraOptions
            },
            cardOptions: {
                shape: CardShape.BackdropOverflow,
                preferThumb: false,
                showParentTitle: true,
                overlayPlayButton: true,
                lines: 2,
                ...cardOptions
            }
        },
        {
            name: 'HeaderFavoriteVideos',
            itemTypes: 'Video,MusicVideo',
            type: FavoriteSectionType.FavoriteVideos,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Video, BaseItemKind.MusicVideo],
                ...parametersOptions,
                ...parametersExtraOptions
            },
            cardOptions: {
                shape: CardShape.BackdropOverflow,
                preferThumb: true,
                overlayPlayButton: true,
                ...cardOptions
            }
        },
        {
            name: 'HeaderFavoriteCollections',
            itemTypes: 'BoxSet',
            type: FavoriteSectionType.FavoriteCollections,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.BoxSet],
                ...parametersOptions,
                ...parametersExtraOptions
            },
            cardOptions: {
                shape: CardShape.PortraitOverflow,
                overlayPlayButton: true,
                ...cardOptions
            }
        },
        {
            name: 'HeaderFavoritePlaylists',
            itemTypes: 'Playlist',
            type: FavoriteSectionType.FavoritePlaylists,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Playlist],
                ...parametersOptions,
                ...parametersExtraOptions
            },
            cardOptions: {
                shape: CardShape.SquareOverflow,
                preferThumb: false,
                showParentTitle: false,
                overlayPlayButton: true,
                coverImage: true,
                ...cardOptions
            }
        },
        {
            name: 'HeaderFavoritePersons',
            itemTypes: 'Person',
            apiMethod: SectionApiMethod.Persons,
            type: FavoriteSectionType.FavoritePeople,
            parametersOptions: {
                ...parametersOptions
            },
            cardOptions: {
                shape: CardShape.PortraitOverflow,
                preferThumb: false,
                showParentTitle: false,
                overlayPlayButton: true,
                coverImage: true,
                ...cardOptions
            }
        },
        {
            name: 'HeaderFavoriteArtists',
            itemTypes: 'MusicArtist',
            apiMethod: SectionApiMethod.Artists,
            type: FavoriteSectionType.FavoriteArtists,
            parametersOptions: {
                ...parametersOptions
            },
            cardOptions: {
                shape: CardShape.SquareOverflow,
                preferThumb: false,
                showParentTitle: false,
                overlayPlayButton: true,
                coverImage: true,
                ...cardOptions
            }
        },
        {
            name: 'HeaderFavoriteAlbums',
            itemTypes: 'MusicAlbum',
            type: FavoriteSectionType.FavoriteAlbums,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.MusicAlbum],
                ...parametersOptions,
                ...parametersExtraOptions
            },
            cardOptions: {
                shape: CardShape.SquareOverflow,
                preferThumb: false,
                showParentTitle: true,
                overlayPlayButton: true,
                coverImage: true,
                lines: 2,
                ...cardOptions
            }
        },
        {
            name: 'HeaderFavoriteSongs',
            itemTypes: 'Audio',
            type: FavoriteSectionType.FavoriteSongs,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Audio],
                ...parametersOptions,
                ...parametersExtraOptions
            },
            cardOptions: {
                shape: CardShape.SquareOverflow,
                preferThumb: false,
                showParentTitle: true,
                overlayMoreButton: true,
                action: 'instantmix',
                coverImage: true,
                lines: 2,
                ...cardOptions
            }
        },
        {
            name: 'HeaderFavoriteBooks',
            itemTypes: 'Book',
            type: FavoriteSectionType.FavoriteBooks,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Book],
                ...parametersOptions,
                ...parametersExtraOptions
            },
            cardOptions: {
                shape: CardShape.PortraitOverflow,
                showYear: true,
                overlayPlayButton: true,
                lines: 2,
                ...cardOptions
            }
        }
    ];
};

