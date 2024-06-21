import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import * as userSettings from 'scripts/settings/userSettings';
import { CardShape } from 'utils/card';
import { type Section, SectionApiMethod, ProgramSectionType, SuggestionSectionType } from 'types/sections';
import { HomeSectionType } from 'types/homeSectionType';

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

function getOldestDateForNextUp() {
    const oldestDateForNextUp = new Date();
    oldestDateForNextUp.setDate(
        oldestDateForNextUp.getDate() - userSettings.maxDaysForNextUp()
    );
    return oldestDateForNextUp;
}

export const getHomeSections = (): Section[] => {
    return [
        {
            name: 'HeaderMyMedia',
            apiMethod: SectionApiMethod.UserViews,
            itemTypes: 'CollectionFolder',
            type: HomeSectionType.LibraryButtons
        },
        {
            name: 'HeaderMyMedia',
            apiMethod: SectionApiMethod.UserViews,
            itemTypes: 'CollectionFolder',
            type: HomeSectionType.SmallLibraryTiles,
            cardOptions: {
                shape: CardShape.BackdropOverflow
            }
        },
        {
            name: 'HeaderContinueWatching',
            apiMethod: SectionApiMethod.ResumeItems,
            itemTypes: 'Video',
            type: HomeSectionType.Resume,
            parametersOptions: {
                recursive: true,
                limit: 12,
                mediaTypes: [MediaType.Video]
            },
            cardOptions: {
                shape: CardShape.BackdropOverflow,
                preferThumb: true,
                inheritThumb:
                    !userSettings.useEpisodeImagesInNextUpAndResume(undefined),
                showParentTitle: true,
                showDetailsMenu: true,
                overlayPlayButton: true,
                showYear: true,
                lines: 2
            }
        },
        {
            name: 'HeaderContinueListening',
            apiMethod: SectionApiMethod.ResumeItems,
            itemTypes: 'Audio',
            type: HomeSectionType.ResumeAudio,
            parametersOptions: {
                recursive: true,
                limit: 12,
                mediaTypes: [MediaType.Audio]
            },
            cardOptions: {
                shape: CardShape.PortraitOverflow,
                showParentTitle: true,
                showDetailsMenu: true,
                overlayPlayButton: true,
                showYear: true,
                lines: 2
            }
        },
        {
            name: 'HeaderContinueReading',
            apiMethod: SectionApiMethod.ResumeItems,
            itemTypes: 'Book',
            type: HomeSectionType.ResumeBook,
            parametersOptions: {
                recursive: true,
                limit: 12,
                mediaTypes: [MediaType.Book]
            },
            cardOptions: {
                shape: CardShape.PortraitOverflow,
                showParentTitle: true,
                showDetailsMenu: true,
                overlayPlayButton: true,
                showYear: true,
                lines: 2
            }
        },
        {
            name: 'LatestFromLibrary',
            apiMethod: SectionApiMethod.LatestMedia,
            itemTypes: 'CollectionFolder',
            type: HomeSectionType.LatestMedia
        },
        {
            name: 'NextUp',
            apiMethod: SectionApiMethod.NextUp,
            itemTypes: 'nextup',
            type: HomeSectionType.NextUp,
            parametersOptions: {
                isAiring: true,
                fields: [
                    ItemFields.PrimaryImageAspectRatio,
                    ItemFields.DateCreated,
                    ItemFields.Path,
                    ItemFields.MediaSourceCount
                ],
                limit: 12,
                disableFirstEpisode: false,
                nextUpDateCutoff: getOldestDateForNextUp().toISOString(),
                enableResumable: false,
                enableRewatching: userSettings.enableRewatchingInNextUp()
            },
            cardOptions: {
                shape: CardShape.BackdropOverflow,
                preferThumb: true,
                inheritThumb:
                    !userSettings.useEpisodeImagesInNextUpAndResume(undefined),
                showParentTitle: true,
                overlayPlayButton: true
            }
        },
        {
            name: 'HeaderOnNow',
            itemTypes: 'Programs',
            apiMethod: SectionApiMethod.RecommendedPrograms,
            type: HomeSectionType.LiveTv,
            parametersOptions: {
                isAiring: true
            },
            cardOptions: {
                shape: CardShape.AutoOverflow,
                defaultShape: CardShape.BackdropOverflow,
                preferThumb: 'auto',
                inheritThumb: false,
                showParentTitleOrTitle: true,
                coverImage: true,
                showAirTime: true,
                showChannelName: false,
                showAirDateTime: false,
                showAirEndTime: true,
                lines: 3,
                overlayPlayButton: true
            }
        },
        {
            name: 'HeaderActiveRecordings',
            itemTypes: 'Recordings',
            apiMethod: SectionApiMethod.Recordings,
            type: HomeSectionType.ActiveRecordings,
            parametersOptions: {
                fields: [ItemFields.PrimaryImageAspectRatio],
                limit: 12,
                isInProgress: true
            },
            cardOptions: {
                shape: CardShape.AutoOverflow,
                defaultShape: CardShape.Backdrop,
                preferThumb: true,
                showParentTitle: true,
                coverImage: true,
                showDetailsMenu: true,
                showYear: true,
                lines: 2,
                overlayPlayButton: false,
                overlayMoreButton: true,
                action: 'none',
                centerPlayButton: true
            }
        }
    ];
};
