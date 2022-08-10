import { BaseItemDto, BaseItemDtoQueryResult, RecommendationDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';

import layoutManager from '../../components/layoutManager';
import loading from '../../components/loading/loading';
import dom from '../../scripts/dom';
import globalize from '../../scripts/globalize';
import RecentlyAddedItemsContainer from '../components/RecentlyAddedItemsContainer';
import RecommendationContainer from '../components/RecommendationContainer';
import ResumableItemsContainer from '../components/ResumableItemsContainer';

type IProps = {
    topParentId: string | null;
}

const SuggestionsView: FunctionComponent<IProps> = (props: IProps) => {
    const [ latestItems, setLatestItems ] = useState<BaseItemDto[]>([]);
    const [ resumeItemsResult, setResumeItemsResult ] = useState<BaseItemDtoQueryResult>();
    const [ recommendations, setRecommendations ] = useState<RecommendationDto[]>([]);
    const element = useRef<HTMLDivElement>(null);

    const enableScrollX = useCallback(() => {
        return !layoutManager.desktop;
    }, []);

    const getPortraitShape = useCallback(() => {
        return enableScrollX() ? 'overflowPortrait' : 'portrait';
    }, [enableScrollX]);

    const getThumbShape = useCallback(() => {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }, [enableScrollX]);

    const autoFocus = useCallback((page) => {
        import('../../components/autoFocuser').then(({default: autoFocuser}) => {
            autoFocuser.autoFocus(page);
        });
    }, []);

    const loadLatest = useCallback((page: HTMLDivElement, userId: string, parentId: string | null) => {
        const options = {
            IncludeItemTypes: 'Movie',
            Limit: 18,
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            EnableTotalRecordCount: false
        };
        window.ApiClient.getJSON(window.ApiClient.getUrl('Users/' + userId + '/Items/Latest', options)).then(items => {
            setLatestItems(items);

            // FIXME: Wait for all sections to load
            autoFocus(page);
        });
    }, [autoFocus]);

    const loadResume = useCallback((page, userId, parentId) => {
        loading.show();
        const screenWidth: any = dom.getWindowSize();
        const options = {
            SortBy: 'DatePlayed',
            SortOrder: 'Descending',
            IncludeItemTypes: 'Movie',
            Filters: 'IsResumable',
            Limit: screenWidth.innerWidth >= 1600 ? 5 : 3,
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
            CollapseBoxSetItems: false,
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            EnableTotalRecordCount: false
        };
        window.ApiClient.getItems(userId, options).then(result => {
            setResumeItemsResult(result);

            loading.hide();
            // FIXME: Wait for all sections to load
            autoFocus(page);
        });
    }, [autoFocus]);

    const loadSuggestions = useCallback((page, userId) => {
        const screenWidth: any = dom.getWindowSize();
        let itemLimit = 5;
        if (screenWidth.innerWidth >= 1600) {
            itemLimit = 8;
        } else if (screenWidth.innerWidth >= 1200) {
            itemLimit = 6;
        }
        const url = window.window.ApiClient.getUrl('Movies/Recommendations', {
            userId: userId,
            categoryLimit: 6,
            ItemLimit: itemLimit,
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb'
        });
        window.ApiClient.getJSON(url).then(result => {
            setRecommendations(result);

            // FIXME: Wait for all sections to load
            autoFocus(page);
        });
    }, [autoFocus]);

    const loadSuggestionsTab = useCallback((view) => {
        const parentId = props.topParentId;
        const userId = window.ApiClient.getCurrentUserId();
        loadResume(view, userId, parentId);
        loadLatest(view, userId, parentId);
        loadSuggestions(view, userId);
    }, [loadLatest, loadResume, loadSuggestions, props.topParentId]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        loadSuggestionsTab(page);
    }, [loadSuggestionsTab]);

    return (
        <div ref={element}>
            <ResumableItemsContainer getThumbShape={getThumbShape} enableScrollX={enableScrollX} itemsResult={resumeItemsResult} />

            <RecentlyAddedItemsContainer getPortraitShape={getPortraitShape} enableScrollX={enableScrollX} items={latestItems} />

            <div id='recommendations'>
                {!recommendations.length ? <div className='noItemsMessage centerMessage'>
                    <h1>{globalize.translate('MessageNothingHere')}</h1>
                    <p>{globalize.translate('MessageNoMovieSuggestionsAvailable')}</p>
                </div> : recommendations.map((recommendation, index) => {
                    return <RecommendationContainer key={index} getPortraitShape={getPortraitShape} enableScrollX={enableScrollX} recommendation={recommendation} />;
                })}
            </div>
        </div>
    );
};

export default SuggestionsView;
