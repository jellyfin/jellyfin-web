import type { BaseItemDto, BaseItemDtoQueryResult, RecommendationDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import layoutManager from '../../../../components/layoutManager';
import loading from '../../../../components/loading/loading';
import dom from '../../../../scripts/dom';
import globalize from '../../../../scripts/globalize';
import RecommendationContainer from '../../../../components/common/RecommendationContainer';
import SectionContainer from '../../../../components/common/SectionContainer';
import { LibraryViewProps } from '../../../../types/interface';

const SuggestionsView: FC<LibraryViewProps> = ({ topParentId }) => {
    const [ latestItems, setLatestItems ] = useState<BaseItemDto[]>([]);
    const [ resumeResult, setResumeResult ] = useState<BaseItemDtoQueryResult>({});
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
        import('../../../../components/autoFocuser').then(({ default: autoFocuser }) => {
            autoFocuser.autoFocus(page);
        }).catch(err => {
            console.error('[SuggestionsView] failed to load data', err);
        });
    }, []);

    const loadResume = useCallback((page, userId, parentId) => {
        loading.show();
        const screenWidth = dom.getWindowSize().innerWidth;
        const options = {
            SortBy: 'DatePlayed',
            SortOrder: 'Descending',
            IncludeItemTypes: 'Movie',
            Filters: 'IsResumable',
            Limit: screenWidth >= 1600 ? 5 : 3,
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
            CollapseBoxSetItems: false,
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            EnableTotalRecordCount: false
        };
        window.ApiClient.getItems(userId, options).then(result => {
            setResumeResult(result);

            loading.hide();
            autoFocus(page);
        }).catch(err => {
            console.error('[SuggestionsView] failed to fetch items', err);
        });
    }, [autoFocus]);

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

            autoFocus(page);
        }).catch(err => {
            console.error('[SuggestionsView] failed to fetch latest items', err);
        });
    }, [autoFocus]);

    const loadSuggestions = useCallback((page, userId) => {
        const screenWidth = dom.getWindowSize().innerWidth;
        let itemLimit = 5;
        if (screenWidth >= 1600) {
            itemLimit = 8;
        } else if (screenWidth >= 1200) {
            itemLimit = 6;
        }
        const url = window.ApiClient.getUrl('Movies/Recommendations', {
            userId: userId,
            categoryLimit: 6,
            ItemLimit: itemLimit,
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb'
        });
        window.ApiClient.getJSON(url).then(result => {
            setRecommendations(result);

            autoFocus(page);
        }).catch(err => {
            console.error('[SuggestionsView] failed to fetch recommendations', err);
        });
    }, [autoFocus]);

    const loadSuggestionsTab = useCallback((view) => {
        const parentId = topParentId;
        const userId = window.ApiClient.getCurrentUserId();
        loadResume(view, userId, parentId);
        loadLatest(view, userId, parentId);
        loadSuggestions(view, userId);
    }, [loadLatest, loadResume, loadSuggestions, topParentId]);

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
            <SectionContainer
                sectionTitle={globalize.translate('HeaderContinueWatching')}
                enableScrollX={enableScrollX}
                items={resumeResult.Items || []}
                cardOptions={{
                    preferThumb: true,
                    shape: getThumbShape(),
                    showYear: true
                }}
            />

            <SectionContainer
                sectionTitle={globalize.translate('HeaderLatestMovies')}
                enableScrollX={enableScrollX}
                items={latestItems}
                cardOptions={{
                    shape: getPortraitShape(),
                    showYear: true
                }}
            />

            {!recommendations.length ? <div className='noItemsMessage centerMessage'>
                <h1>{globalize.translate('MessageNothingHere')}</h1>
                <p>{globalize.translate('MessageNoMovieSuggestionsAvailable')}</p>
            </div> : recommendations.map(recommendation => {
                return <RecommendationContainer key={recommendation.CategoryId} getPortraitShape={getPortraitShape} enableScrollX={enableScrollX} recommendation={recommendation} />;
            })}
        </div>
    );
};

export default SuggestionsView;
