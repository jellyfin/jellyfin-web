import type { RecommendationDto } from '@jellyfin/sdk/lib/generated-client/models/recommendation-dto';
import { RecommendationType } from '@jellyfin/sdk/lib/generated-client/models/recommendation-type';
import { type FC } from 'react';

import { useApi } from 'hooks/useApi';
import {
    useGetMovieRecommendations,
    useGetSuggestionSectionsWithItems
} from 'hooks/useFetchItems';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import SectionContainer from '../../../../components/common/SectionContainer';
import { CardShape } from 'utils/card';
import type { ParentId } from 'types/library';
import type { Section, SectionType } from 'types/sections';
import type { ItemDto } from 'types/base/models/item-dto';

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
    } = useGetMovieRecommendations(isMovieRecommendationEnabled, parentId);

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
            parentId: parentId
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
