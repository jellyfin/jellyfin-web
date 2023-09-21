import { RecommendationDto, RecommendationType } from '@jellyfin/sdk/lib/generated-client';
import React, { FC } from 'react';

import globalize from 'scripts/globalize';
import escapeHTML from 'escape-html';
import SectionContainer from './SectionContainer';

interface RecommendationContainerProps {
    recommendation?: RecommendationDto;
}

const RecommendationContainer: FC<RecommendationContainerProps> = ({
    recommendation = {}
}) => {
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

    return (
        <SectionContainer
            sectionTitle={escapeHTML(title)}
            items={recommendation.Items ?? []}
            cardOptions={{
                shape: 'overflowPortrait',
                showYear: true,
                scalable: true,
                overlayPlayButton: true,
                showTitle: true,
                centerText: true,
                cardLayout: false
            }}
        />
    );
};

export default RecommendationContainer;
