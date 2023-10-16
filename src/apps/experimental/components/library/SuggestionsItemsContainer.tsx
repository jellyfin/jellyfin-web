import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import React, { FC } from 'react';
import * as userSettings from 'scripts/settings/userSettings';
import SuggestionsSectionContainer from './SuggestionsSectionContainer';
import { Sections, SectionsView, SectionsViewType } from 'types/suggestionsSections';
import { ParentId } from 'types/library';

const getSuggestionsSections = (): Sections[] => {
    return [
        {
            name: 'HeaderContinueWatching',
            viewType: SectionsViewType.ResumeItems,
            type: 'Movie',
            view: SectionsView.ContinueWatchingMovies,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Movie]
            },
            cardOptions: {
                scalable: true,
                overlayPlayButton: true,
                showTitle: true,
                centerText: true,
                cardLayout: false,
                preferThumb: true,
                shape: 'overflowBackdrop',
                showYear: true
            }
        },
        {
            name: 'HeaderLatestMovies',
            viewType: SectionsViewType.LatestMedia,
            type: 'Movie',
            view: SectionsView.LatestMovies,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Movie]
            },
            cardOptions: {
                scalable: true,
                overlayPlayButton: true,
                showTitle: true,
                centerText: true,
                cardLayout: false,
                shape: 'overflowPortrait',
                showYear: true
            }
        },
        {
            name: 'HeaderContinueWatching',
            viewType: SectionsViewType.ResumeItems,
            type: 'Episode',
            view: SectionsView.ContinueWatchingEpisode,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Episode]
            },
            cardOptions: {
                scalable: true,
                overlayPlayButton: true,
                showTitle: true,
                centerText: true,
                cardLayout: false,
                shape: 'overflowBackdrop',
                preferThumb: true,
                inheritThumb:
                    !userSettings.useEpisodeImagesInNextUpAndResume(undefined),
                showYear: true
            }
        },
        {
            name: 'HeaderLatestEpisodes',
            viewType: SectionsViewType.LatestMedia,
            type: 'Episode',
            view: SectionsView.LatestEpisode,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Episode]
            },
            cardOptions: {
                scalable: true,
                overlayPlayButton: true,
                showTitle: true,
                centerText: true,
                cardLayout: false,
                shape: 'overflowBackdrop',
                preferThumb: true,
                showSeriesYear: true,
                showParentTitle: true,
                overlayText: false,
                showUnplayedIndicator: false,
                showChildCountIndicator: true,
                lazy: true,
                lines: 2
            }
        },
        {
            name: 'NextUp',
            viewType: SectionsViewType.NextUp,
            type: 'nextup',
            view: SectionsView.NextUp,
            cardOptions: {
                scalable: true,
                overlayPlayButton: true,
                showTitle: true,
                centerText: true,
                cardLayout: false,
                shape: 'overflowBackdrop',
                preferThumb: true,
                inheritThumb:
                    !userSettings.useEpisodeImagesInNextUpAndResume(undefined),
                showParentTitle: true,
                overlayText: false
            }
        },
        {
            name: 'HeaderLatestMusic',
            viewType: SectionsViewType.LatestMedia,
            type: 'Audio',
            view: SectionsView.LatestMusic,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Audio]
            },
            cardOptions: {
                showUnplayedIndicator: false,
                shape: 'overflowSquare',
                showTitle: true,
                showParentTitle: true,
                lazy: true,
                centerText: true,
                overlayPlayButton: true,
                cardLayout: false,
                coverImage: true
            }
        },
        {
            name: 'HeaderRecentlyPlayed',
            type: 'Audio',
            view: SectionsView.RecentlyPlayedMusic,
            parametersOptions: {
                sortBy: [ItemSortBy.DatePlayed],
                sortOrder: [SortOrder.Descending],
                includeItemTypes: [BaseItemKind.Audio]
            },
            cardOptions: {
                showUnplayedIndicator: false,
                shape: 'overflowSquare',
                showTitle: true,
                showParentTitle: true,
                action: 'instantmix',
                lazy: true,
                centerText: true,
                overlayMoreButton: true,
                cardLayout: false,
                coverImage: true
            }
        },
        {
            name: 'HeaderFrequentlyPlayed',
            type: 'Audio',
            view: SectionsView.FrequentlyPlayedMusic,
            parametersOptions: {
                sortBy: [ItemSortBy.PlayCount],
                sortOrder: [SortOrder.Descending],
                includeItemTypes: [BaseItemKind.Audio]
            },
            cardOptions: {
                showUnplayedIndicator: false,
                shape: 'overflowSquare',
                showTitle: true,
                showParentTitle: true,
                action: 'instantmix',
                lazy: true,
                centerText: true,
                overlayMoreButton: true,
                cardLayout: false,
                coverImage: true
            }
        }
    ];
};

interface SuggestionsItemsContainerProps {
    parentId: ParentId;
    sectionsView: SectionsView[];
}

const SuggestionsItemsContainer: FC<SuggestionsItemsContainerProps> = ({
    parentId,
    sectionsView
}) => {
    const suggestionsSections = getSuggestionsSections();

    return (
        <>
            {suggestionsSections
                .filter((section) => sectionsView.includes(section.view))
                .map((section) => (
                    <SuggestionsSectionContainer
                        key={section.view}
                        parentId={parentId}
                        section={section}
                    />
                ))}
        </>
    );
};

export default SuggestionsItemsContainer;
