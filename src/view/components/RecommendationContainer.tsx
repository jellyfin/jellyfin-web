import '../../elements/emby-itemscontainer/emby-itemscontainer';

import { RecommendationDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent, useEffect, useRef } from 'react';

import cardBuilder from '../../components/cardbuilder/cardBuilder';
import globalize from '../../scripts/globalize';
import ItemsContainerElement from '../../elements/ItemsContainerElement';
import ItemsScrollerContainerElement from '../../elements/ItemsScrollerContainerElement';
import escapeHTML from 'escape-html';

type RecommendationContainerProps = {
    getPortraitShape: () => string;
    enableScrollX: () => boolean;
    recommendation?: RecommendationDto;
}

const RecommendationContainer: FunctionComponent<RecommendationContainerProps> = ({ getPortraitShape, enableScrollX, recommendation = {} }: RecommendationContainerProps) => {
    const element = useRef<HTMLDivElement>(null);

    let title = '';

    switch (recommendation.RecommendationType) {
        case 'SimilarToRecentlyPlayed':
            title = globalize.translate('RecommendationBecauseYouWatched', recommendation.BaselineItemName);
            break;

        case 'SimilarToLikedItem':
            title = globalize.translate('RecommendationBecauseYouLike', recommendation.BaselineItemName);
            break;

        case 'HasDirectorFromRecentlyPlayed':
        case 'HasLikedDirector':
            title = globalize.translate('RecommendationDirectedBy', recommendation.BaselineItemName);
            break;

        case 'HasActorFromRecentlyPlayed':
        case 'HasLikedActor':
            title = globalize.translate('RecommendationStarring', recommendation.BaselineItemName);
            break;
    }

    useEffect(() => {
        cardBuilder.buildCards(recommendation.Items || [], {
            itemsContainer: element.current?.querySelector('.itemsContainer'),
            shape: getPortraitShape(),
            scalable: true,
            overlayPlayButton: true,
            allowBottomPadding: true,
            showTitle: true,
            showYear: true,
            centerText: true
        });
    }, [enableScrollX, getPortraitShape, recommendation]);

    return (
        <div ref={element}>
            <div className='verticalSection'>
                <div className='sectionTitleContainer sectionTitleContainer-cards'>
                    <h2 className='sectionTitle sectionTitle-cards padded-left'>
                        {escapeHTML(title)}
                    </h2>
                </div>

                {enableScrollX() ? <ItemsScrollerContainerElement
                    scrollerclassName='padded-top-focusscale padded-bottom-focusscale'
                    dataMousewheel='false'
                    dataCenterfocus='true'
                    className='itemsContainer scrollSlider focuscontainer-x'
                /> : <ItemsContainerElement
                    className='itemsContainer focuscontainer-x padded-left padded-right vertical-wrap'
                />}

            </div>
        </div>
    );
};

export default RecommendationContainer;
