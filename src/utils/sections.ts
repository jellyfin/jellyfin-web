import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';

import { ItemAction } from 'constants/itemAction';
import * as userSettings from 'scripts/settings/userSettings';
import { type Section, SectionType, SectionApiMethod } from 'types/sections';
import { CardShape } from 'utils/card';

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
        ]
    };
    return [
        {
            name: 'HeaderContinueWatching',
            apiMethod: SectionApiMethod.ResumeItems,
            itemTypes: 'Movie',
            type: SectionType.ContinueWatchingMovies,
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
            type: SectionType.LatestMovies,
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
            type: SectionType.ContinueWatchingEpisode,
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
            type: SectionType.LatestEpisode,
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
            type: SectionType.NextUp,
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
            type: SectionType.LatestMusic,
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
            type: SectionType.RecentlyPlayedMusic,
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
                action: ItemAction.InstantMix,
                overlayMoreButton: true,
                coverImage: true
            }
        },
        {
            name: 'HeaderFrequentlyPlayed',
            itemTypes: 'Audio',
            type: SectionType.FrequentlyPlayedMusic,
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
                action: ItemAction.InstantMix,
                overlayMoreButton: true,
                coverImage: true
            }
        },
        {
            name: 'HeaderLatestMusicVideos',
            apiMethod: SectionApiMethod.LatestMedia,
            itemTypes: 'Video',
            type: SectionType.LatestMusicVideos,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.MusicVideo]
            },
            cardOptions: {
                showUnplayedIndicator: false,
                shape: CardShape.BackdropOverflow,
                showParentTitle: true,
                overlayPlayButton: true,
                coverImage: true
            }
        },
        {
            name: 'HeaderRecentlyPlayed',
            itemTypes: 'Video',
            type: SectionType.RecentlyPlayedMusicVideos,
            parametersOptions: {
                sortBy: [ItemSortBy.DatePlayed],
                sortOrder: [SortOrder.Descending],
                includeItemTypes: [BaseItemKind.MusicVideo],
                ...parametersOptions
            },
            cardOptions: {
                showUnplayedIndicator: false,
                shape: CardShape.BackdropOverflow,
                showParentTitle: true,
                overlayMoreButton: true,
                coverImage: true
            }
        },
        {
            name: 'HeaderFrequentlyPlayed',
            itemTypes: 'Video',
            type: SectionType.FrequentlyPlayedMusicVideos,
            parametersOptions: {
                sortBy: [ItemSortBy.PlayCount],
                sortOrder: [SortOrder.Descending],
                includeItemTypes: [BaseItemKind.MusicVideo],
                ...parametersOptions
            },
            cardOptions: {
                showUnplayedIndicator: false,
                shape: CardShape.BackdropOverflow,
                showParentTitle: true,
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
            type: SectionType.ActivePrograms,
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
            type: SectionType.UpcomingEpisodes,
            parametersOptions: {
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
            type: SectionType.UpcomingMovies,
            parametersOptions: {
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
            type: SectionType.UpcomingSports,
            parametersOptions: {
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
            type: SectionType.UpcomingKids,
            parametersOptions: {
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
            type: SectionType.UpcomingNews,
            parametersOptions: {
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
            type: SectionType.LatestRecordings,
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
            type: SectionType.RecordingFolders,
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
            type: SectionType.ActiveRecordings,
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
