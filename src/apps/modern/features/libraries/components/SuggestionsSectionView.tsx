import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import type { RecommendationDto } from '@jellyfin/sdk/lib/generated-client/models/recommendation-dto';
import { RecommendationType } from '@jellyfin/sdk/lib/generated-client/models/recommendation-type';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import React, { type FC } from 'react';

import { CardShape } from 'components/cardbuilder/utils/shape';
import { useApi } from 'hooks/useApi';
import { useGetSuggestionSectionsWithItems } from 'hooks/useFetchItems';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import SectionContainer from 'components/common/SectionContainer';
import type { ParentId } from 'types/library';
import { type Section, SectionApiMethod, SectionType } from 'types/sections';
import type { ItemDto } from 'types/base/models/item-dto';

import { useMovieRecommendations } from '../hooks/api/useMovieRecommendations';

// A row's header opens the list page with the row's own filter and order.
// The sort values are options from the list page's sort menu, so it can name them.
const getListRouteOptions = (section: Section) => {
    const isRecentlyPlayed = section.type === SectionType.RecentlyPlayedMusic
        || section.type === SectionType.RecentlyPlayedMusicVideos;
    const isFrequentlyPlayed = section.type === SectionType.FrequentlyPlayedMusic
        || section.type === SectionType.FrequentlyPlayedMusicVideos;

    if (section.apiMethod === SectionApiMethod.LatestMedia) {
        return {
            sortBy: [ItemSortBy.DateCreated, ItemSortBy.SortName].join(','),
            sortOrder: SortOrder.Descending
        };
    }

    if (section.apiMethod === SectionApiMethod.ResumeItems) {
        return {
            isResumable: true,
            sortBy: [ItemSortBy.DatePlayed, ItemSortBy.SortName].join(','),
            sortOrder: SortOrder.Descending
        };
    }

    if (isRecentlyPlayed) {
        return {
            isPlayed: true,
            sortBy: [ItemSortBy.DatePlayed, ItemSortBy.SortName].join(','),
            sortOrder: SortOrder.Descending
        };
    }

    if (isFrequentlyPlayed) {
        return {
            isPlayed: true,
            sortBy: [ItemSortBy.PlayCount, ItemSortBy.SortName].join(','),
            sortOrder: SortOrder.Descending
        };
    }

    return {};
};

interface SuggestionsSectionViewProps {
    parentId: ParentId;
    sectionType: SectionType[];
    isMovieRecommendationEnabled: boolean | undefined;
}

const SuggestionsSectionView: FC<SuggestionsSectionViewProps> = ({
    parentId,
    sectionType,
    isMovieRecommendationEnabled = false
}) => {
    const { __legacyApiClient__ } = useApi();
    const { isLoading, data: sectionsWithItems } =
        useGetSuggestionSectionsWithItems(parentId, sectionType);

    const {
        isLoading: isRecommendationsLoading,
        data: movieRecommendationsItems
    } = useMovieRecommendations({
        parentId: parentId || undefined,
        fields: [
            ItemFields.PrimaryImageAspectRatio,
            ItemFields.MediaSourceCount
        ],
        categoryLimit: 6,
        itemLimit: 20
    }, isMovieRecommendationEnabled);

    if (isLoading || isRecommendationsLoading) {
        return <Loading />;
    }

    if (!sectionsWithItems?.length && !movieRecommendationsItems?.length) {
        return <NoItemsMessage />;
    }

    const getRouteUrl = (section: Section) => {
        return appRouter.getRouteUrl('list', {
            serverId: window.ApiClient.serverId(),
            itemTypes: section.itemTypes,
            parentId: parentId,
            ...getListRouteOptions(section)
        });
    };

    const getRecommendationTittle = (recommendation: RecommendationDto) => {
        let title = '';

        switch (recommendation.RecommendationType) {
            case RecommendationType.SimilarToRecentlyPlayed:
                title = globalize.translate(
                    'RecommendationBecauseYouWatched',
                    recommendation.BaselineItemName
                );
                break;

            case RecommendationType.SimilarToLikedItem:
                title = globalize.translate(
                    'RecommendationBecauseYouLike',
                    recommendation.BaselineItemName
                );
                break;

            case RecommendationType.HasDirectorFromRecentlyPlayed:
            case RecommendationType.HasLikedDirector:
                title = globalize.translate(
                    'RecommendationDirectedBy',
                    recommendation.BaselineItemName
                );
                break;

            case RecommendationType.HasActorFromRecentlyPlayed:
            case RecommendationType.HasLikedActor:
                title = globalize.translate(
                    'RecommendationStarring',
                    recommendation.BaselineItemName
                );
                break;
        }
        return title;
    };

    return (
        <>
            {sectionsWithItems?.map(({ section, items }) => (
                <SectionContainer
                    key={section.type}
                    sectionHeaderProps={{
                        title: globalize.translate(section.name),
                        url: getRouteUrl(section)
                    }}
                    itemsContainerProps={{
                        queryKey: ['SuggestionSectionWithItems']
                    }}
                    items={items}
                    cardOptions={{
                        ...section.cardOptions,
                        queryKey: ['SuggestionSectionWithItems'],
                        showTitle: true,
                        centerText: true,
                        cardLayout: false,
                        overlayText: false,
                        serverId: __legacyApiClient__?.serverId()
                    }}
                />
            ))}

            {movieRecommendationsItems?.map((recommendation, index) => (
                <SectionContainer
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${recommendation.CategoryId}-${index}`} // use a unique id return value may have duplicate id
                    sectionHeaderProps={{
                        title: getRecommendationTittle(recommendation)
                    }}
                    itemsContainerProps={{
                        queryKey: ['MovieRecommendations']
                    }}
                    items={recommendation.Items as ItemDto[]}
                    cardOptions={{
                        queryKey: ['MovieRecommendations'],
                        shape: CardShape.PortraitOverflow,
                        showYear: true,
                        scalable: true,
                        overlayPlayButton: true,
                        showTitle: true,
                        centerText: true,
                        cardLayout: false,
                        serverId: __legacyApiClient__?.serverId()
                    }}
                />
            ))}
        </>
    );
};

export default SuggestionsSectionView;
