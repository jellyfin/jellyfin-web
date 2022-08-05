import '../../elements/emby-button/emby-button';
import '../../elements/emby-itemscontainer/emby-itemscontainer';

import { BaseItemDtoQueryResult } from '@thornbill/jellyfin-sdk/dist/generated-client';
import escapeHTML from 'escape-html';
import React, { FunctionComponent, useCallback, useEffect, useRef } from 'react';

import { appRouter } from '../../components/appRouter';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import layoutManager from '../../components/layoutManager';
import lazyLoader from '../../components/lazyLoader/lazyLoaderIntersectionObserver';
import globalize from '../../scripts/globalize';
import { IQuery } from './type';

type GenresItemsContainerProps = {
    topParentId?: string | null;
    getCurrentViewStyle: () => string;
    query: IQuery;
    itemsResult?: BaseItemDtoQueryResult;
}

const GenresItemsContainer: FunctionComponent<GenresItemsContainerProps> = ({ topParentId, getCurrentViewStyle, query, itemsResult = {} }: GenresItemsContainerProps) => {
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

    const fillItemsContainer = useCallback((entry) => {
        const elem = entry.target;
        const id = elem.getAttribute('data-id');
        const viewStyle = getCurrentViewStyle();
        let limit = viewStyle == 'Thumb' || viewStyle == 'ThumbCard' ? 5 : 9;

        if (enableScrollX()) {
            limit = 10;
        }

        const enableImageTypes = viewStyle == 'Thumb' || viewStyle == 'ThumbCard' ? 'Primary,Backdrop,Thumb' : 'Primary';
        const query = {
            SortBy: 'Random',
            SortOrder: 'Ascending',
            IncludeItemTypes: 'Movie',
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
            ImageTypeLimit: 1,
            EnableImageTypes: enableImageTypes,
            Limit: limit,
            GenreIds: id,
            EnableTotalRecordCount: false,
            ParentId: topParentId
        };
        window.ApiClient.getItems(window.ApiClient.getCurrentUserId(), query).then((result) => {
            const items = result.Items || [];
            if (viewStyle == 'Thumb') {
                cardBuilder.buildCards(items, {
                    itemsContainer: elem,
                    shape: getThumbShape(),
                    preferThumb: true,
                    showTitle: true,
                    scalable: true,
                    centerText: true,
                    overlayMoreButton: true,
                    allowBottomPadding: false
                });
            } else if (viewStyle == 'ThumbCard') {
                cardBuilder.buildCards(items, {
                    itemsContainer: elem,
                    shape: getThumbShape(),
                    preferThumb: true,
                    showTitle: true,
                    scalable: true,
                    centerText: false,
                    cardLayout: true,
                    showYear: true
                });
            } else if (viewStyle == 'PosterCard') {
                cardBuilder.buildCards(items, {
                    itemsContainer: elem,
                    shape: getPortraitShape(),
                    showTitle: true,
                    scalable: true,
                    centerText: false,
                    cardLayout: true,
                    showYear: true
                });
            } else if (viewStyle == 'Poster') {
                cardBuilder.buildCards(items, {
                    itemsContainer: elem,
                    shape: getPortraitShape(),
                    scalable: true,
                    overlayMoreButton: true,
                    allowBottomPadding: true,
                    showTitle: true,
                    centerText: true,
                    showYear: true
                });
            }
        });
    }, [enableScrollX, getCurrentViewStyle, getPortraitShape, getThumbShape, topParentId]);

    useEffect(() => {
        const elem = element.current?.querySelector('#items') as HTMLDivElement;
        let html = '';
        const items = itemsResult.Items || [];

        for (let i = 0, length = items.length; i < length; i++) {
            const item = items[i];

            html += '<div class="verticalSection">';
            html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
            html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl(item, {
                context: 'movies',
                parentId: topParentId
            }) + '" class="more button-flat button-flat-mini sectionTitleTextButton btnMoreFromGenre' + item.Id + '">';
            html += '<h2 class="sectionTitle sectionTitle-cards">';
            html += escapeHTML(item.Name);
            html += '</h2>';
            html += '<span class="material-icons chevron_right" aria-hidden="true"></span>';
            html += '</a>';
            html += '</div>';
            if (enableScrollX()) {
                let scrollXClass = 'scrollX hiddenScrollX';

                if (layoutManager.tv) {
                    scrollXClass += 'smoothScrollX padded-top-focusscale padded-bottom-focusscale';
                }

                html += '<div is="emby-itemscontainer" class="itemsContainer ' + scrollXClass + ' lazy padded-left padded-right" data-id="' + item.Id + '">';
            } else {
                html += '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap lazy padded-left padded-right" data-id="' + item.Id + '">';
            }

            html += '</div>';
            html += '</div>';
        }

        if (!itemsResult.Items?.length) {
            html = '';

            html += '<div class="noItemsMessage centerMessage">';
            html += '<h1>' + globalize.translate('MessageNothingHere') + '</h1>';
            html += '<p>' + globalize.translate('MessageNoGenresAvailable') + '</p>';
            html += '</div>';
        }

        elem.innerHTML = html;
        lazyLoader.lazyChildren(elem, fillItemsContainer);
    }, [getCurrentViewStyle, query.SortBy, itemsResult.Items, fillItemsContainer, topParentId, enableScrollX]);

    return (
        <div ref={element}>
            <div id='items'></div>
        </div>
    );
};

export default GenresItemsContainer;
