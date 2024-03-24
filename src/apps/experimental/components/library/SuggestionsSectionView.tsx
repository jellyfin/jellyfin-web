import {
    type RecommendationDto,
    RecommendationType
} from '@jellyfin/sdk/lib/generated-client';
import React, { type FC } from 'react';
import {
    useGetMovieRecommendations,
    useGetSuggestionSectionsWithItems
} from 'hooks/useFetchItems';
import { appRouter } from 'components/router/appRouter';
import globalize from 'scripts/globalize';
import Loading from 'components/loading/LoadingComponent';
import SectionContainer from './SectionContainer';
import { CardShape } from 'utils/card';
import type { ParentId } from 'types/library';
import type { Section, SectionType } from 'types/sections';

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
        return (
            <div className='noItemsMessage centerMessage'>
                <h1>{globalize.translate('MessageNothingHere')}</h1>
                <p>{globalize.translate('MessageNoItemsAvailable')}</p>
            </div>
        );
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
                    sectionTitle={globalize.translate(section.name)}
                    items={items ?? []}
                    url={getRouteUrl(section)}
                    cardOptions={{
                        ...section.cardOptions,
                        queryKey: ['SuggestionSectionWithItems'],
                        showTitle: true,
                        centerText: true,
                        cardLayout: false,
                        overlayText: false
                    }}
                />
            ))}

            {movieRecommendationsItems?.map((recommendation, index) => (
                <SectionContainer
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${recommendation.CategoryId}-${index}`} // use a unique id return value may have duplicate id
                    sectionTitle={getRecommendationTittle(recommendation)}
                    items={recommendation.Items ?? []}
                    cardOptions={{
                        queryKey: ['MovieRecommendations'],
                        shape: CardShape.PortraitOverflow,
                        showYear: true,
                        scalable: true,
                        overlayPlayButton: true,
                        showTitle: true,
                        centerText: true,
                        cardLayout: false
                    }}
                />
            ))}
        </>
    );
};

export default SuggestionsSectionView;
