import '../../elements/emby-button/emby-button';
import '../../elements/emby-itemscontainer/emby-itemscontainer';

import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import escapeHTML from 'escape-html';
import React, { FC, useCallback, useEffect, useRef } from 'react';

import { appRouter } from '../router/appRouter';
import cardBuilder from '../cardbuilder/cardBuilder';
import layoutManager from '../layoutManager';
import lazyLoader from '../lazyLoader/lazyLoaderIntersectionObserver';
import globalize from '../../scripts/globalize';
import ItemsScrollerContainerElement from '../../elements/ItemsScrollerContainerElement';
import ItemsContainerElement from '../../elements/ItemsContainerElement';

const createLinkElement = ({ className, title, href }: { className?: string, title?: string | null, href?: string }) => ({
    __html: `<a
        is="emby-linkbutton"
        class="${className}"
        href="${href}"
        >
            <h2 class='sectionTitle sectionTitle-cards'>
                ${title}
            </h2>
            <span class='material-icons chevron_right' aria-hidden='true'></span>
    </a>`
});

interface GenresItemsContainerProps {
    topParentId?: string | null;
    itemsResult: BaseItemDtoQueryResult;
}

const GenresItemsContainer: FC<GenresItemsContainerProps> = ({
    topParentId,
    itemsResult = {}
}) => {
    const element = useRef<HTMLDivElement>(null);

    const enableScrollX = useCallback(() => {
        return !layoutManager.desktop;
    }, []);

    const getPortraitShape = useCallback(() => {
        return enableScrollX() ? 'overflowPortrait' : 'portrait';
    }, [enableScrollX]);

    const fillItemsContainer = useCallback((entry) => {
        const elem = entry.target;
        const id = elem.getAttribute('data-id');

        const query = {
            SortBy: 'Random',
            SortOrder: 'Ascending',
            IncludeItemTypes: 'Movie',
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary',
            Limit: 12,
            GenreIds: id,
            EnableTotalRecordCount: false,
            ParentId: topParentId
        };
        window.ApiClient.getItems(window.ApiClient.getCurrentUserId(), query).then((result) => {
            cardBuilder.buildCards(result.Items || [], {
                itemsContainer: elem,
                shape: getPortraitShape(),
                scalable: true,
                overlayMoreButton: true,
                allowBottomPadding: true,
                showTitle: true,
                centerText: true,
                showYear: true
            });
        }).catch(err => {
            console.error('[GenresItemsContainer] failed to fetch items', err);
        });
    }, [getPortraitShape, topParentId]);

    useEffect(() => {
        const elem = element.current;
        lazyLoader.lazyChildren(elem, fillItemsContainer);
    }, [itemsResult.Items, fillItemsContainer]);

    const items = itemsResult.Items || [];
    return (
        <div ref={element}>
            {
                !items.length ? (
                    <div className='noItemsMessage centerMessage'>
                        <h1>{globalize.translate('MessageNothingHere')}</h1>
                        <p>{globalize.translate('MessageNoGenresAvailable')}</p>
                    </div>
                ) : items.map(item => (
                    <div key={item.Id} className='verticalSection'>
                        <div
                            className='sectionTitleContainer sectionTitleContainer-cards padded-left'
                            dangerouslySetInnerHTML={createLinkElement({
                                className: 'more button-flat button-flat-mini sectionTitleTextButton btnMoreFromGenre',
                                title: escapeHTML(item.Name),
                                href: appRouter.getRouteUrl(item, {
                                    context: 'movies',
                                    parentId: topParentId
                                })
                            })}
                        />

                        {enableScrollX() ?
                            <ItemsScrollerContainerElement
                                scrollerclassName='padded-top-focusscale padded-bottom-focusscale'
                                dataMousewheel='false'
                                dataCenterfocus='true'
                                className='itemsContainer scrollSlider focuscontainer-x lazy'
                                dataId={item.Id}
                            /> : <ItemsContainerElement
                                className='itemsContainer vertical-wrap lazy padded-left padded-right'
                                dataId={item.Id}
                            />
                        }
                    </div>
                ))
            }
        </div>
    );
};

export default GenresItemsContainer;
