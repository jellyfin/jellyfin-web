import escapeHtml from 'escape-html';
import React, { FunctionComponent, useCallback, useEffect, useRef } from 'react';

import cardBuilder from '../../components/cardbuilder/cardBuilder';
import imageLoader from '../../components/images/imageLoader';
import layoutManager from '../../components/layoutManager';
import loading from '../../components/loading/loading';
import ItemsContainerElement from '../../elements/ItemsContainerElement';
import dom from '../../scripts/dom';
import globalize from '../../scripts/globalize';

type IProps = {
    topParentId: string | null;
}

const SuggestionsView: FunctionComponent<IProps> = (props: IProps) => {
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
            const allowBottomPadding = !enableScrollX();
            const container = page.querySelector('#recentlyAddedItems');
            cardBuilder.buildCards(items, {
                itemsContainer: container,
                shape: getPortraitShape(),
                scalable: true,
                overlayPlayButton: true,
                allowBottomPadding: allowBottomPadding,
                showTitle: true,
                showYear: true,
                centerText: true
            });

            // FIXME: Wait for all sections to load
            autoFocus(page);
        });
    }, [autoFocus, enableScrollX, getPortraitShape]);

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
            if (result.Items?.length) {
                page.querySelector('#resumableSection').classList.remove('hide');
            } else {
                page.querySelector('#resumableSection').classList.add('hide');
            }

            const allowBottomPadding = !enableScrollX();
            const container = page.querySelector('#resumableItems');
            cardBuilder.buildCards(result.Items || [], {
                itemsContainer: container,
                preferThumb: true,
                shape: getThumbShape(),
                scalable: true,
                overlayPlayButton: true,
                allowBottomPadding: allowBottomPadding,
                cardLayout: false,
                showTitle: true,
                showYear: true,
                centerText: true
            });
            loading.hide();
            // FIXME: Wait for all sections to load
            autoFocus(page);
        });
    }, [autoFocus, enableScrollX, getThumbShape]);

    const getRecommendationHtml = useCallback((recommendation) => {
        let html = '';
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

        html += '<div class="verticalSection">';
        html += `<h2 class="sectionTitle sectionTitle-cards padded-left">${escapeHtml(title)}</h2>`;
        const allowBottomPadding = true;

        if (enableScrollX()) {
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true">';
            html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">';
        } else {
            html += '<div is="emby-itemscontainer" class="itemsContainer focuscontainer-x padded-left padded-right vertical-wrap">';
        }

        html += cardBuilder.getCardsHtml(recommendation.Items, {
            shape: getPortraitShape(),
            scalable: true,
            overlayPlayButton: true,
            allowBottomPadding: allowBottomPadding,
            showTitle: true,
            showYear: true,
            centerText: true
        });

        if (enableScrollX()) {
            html += '</div>';
        }
        html += '</div>';
        html += '</div>';
        return html;
    }, [enableScrollX, getPortraitShape]);

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
        window.ApiClient.getJSON(url).then(recommendations => {
            if (!recommendations.length) {
                page.querySelector('.noItemsMessage').classList.remove('hide');
                page.querySelector('.recommendations').innerHTML = '';
                return;
            }

            const html = recommendations.map(getRecommendationHtml).join('');
            page.querySelector('.noItemsMessage').classList.add('hide');
            const recs = page.querySelector('.recommendations');
            recs.innerHTML = html;
            imageLoader.lazyChildren(recs);

            // FIXME: Wait for all sections to load
            autoFocus(page);
        });
    }, [autoFocus, getRecommendationHtml]);

    const loadSuggestionsTab = useCallback((view) => {
        const parentId = props.topParentId;
        const userId = window.ApiClient.getCurrentUserId();
        loadResume(view, userId, parentId);
        loadLatest(view, userId, parentId);
        loadSuggestions(view, userId);
    }, [loadLatest, loadResume, loadSuggestions, props.topParentId]);

    const initSuggestedTab = useCallback((tabContent) => {
        function setScrollClasses(elem: { classList: { add: (arg0: string) => void; remove: (arg0: string) => void; }; }, scrollX: boolean) {
            if (scrollX) {
                elem.classList.add('hiddenScrollX');

                if (layoutManager.tv) {
                    elem.classList.add('smoothScrollX');
                    elem.classList.add('padded-top-focusscale');
                    elem.classList.add('padded-bottom-focusscale');
                }

                elem.classList.add('scrollX');
                elem.classList.remove('vertical-wrap');
            } else {
                elem.classList.remove('hiddenScrollX');
                elem.classList.remove('smoothScrollX');
                elem.classList.remove('scrollX');
                elem.classList.add('vertical-wrap');
            }
        }
        const containers = tabContent.querySelectorAll('.itemsContainer');

        for (const container of containers) {
            setScrollClasses(container, enableScrollX());
        }
    }, [enableScrollX]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        initSuggestedTab(page);
    }, [initSuggestedTab]);

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
            <div id='resumableSection' className='verticalSection hide'>
                <div className='sectionTitleContainer sectionTitleContainer-cards'>
                    <h2 className='sectionTitle sectionTitle-cards padded-left'>
                        {globalize.translate('HeaderContinueWatching')}
                    </h2>
                </div>

                <ItemsContainerElement
                    id='resumableItems'
                    className='itemsContainer padded-left padded-right'
                />

            </div>

            <div className='verticalSection'>
                <div className='sectionTitleContainer sectionTitleContainer-cards'>
                    <h2 className='sectionTitle sectionTitle-cards padded-left'>
                        {globalize.translate('HeaderLatestMovies')}
                    </h2>
                </div>

                <ItemsContainerElement
                    id='recentlyAddedItems'
                    className='itemsContainer padded-left padded-right'
                />

            </div>

            <div className='recommendations'>
            </div>
            <div className='noItemsMessage hide padded-left padded-right'>
                <br />
                <p>
                    {globalize.translate('MessageNoMovieSuggestionsAvailable')}
                </p>
            </div>
        </div>
    );
};

export default SuggestionsView;
