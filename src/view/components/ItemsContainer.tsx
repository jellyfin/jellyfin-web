import { BaseItemDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent, useEffect, useRef } from 'react';

import ItemsContainerElement from '../../elements/ItemsContainerElement';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import listview from '../../components/listview/listview';
import globalize from '../../scripts/globalize';
import imageLoader from '../../components/images/imageLoader';
import '../../elements/emby-itemscontainer/emby-itemscontainer';
import { IQuery } from './type';

type ItemsContainerProps = {
    getCurrentViewStyle: () => string;
    query: IQuery;
    items?: BaseItemDto[] | null;
    noItemsMessage?: string;
}

const ItemsContainer: FunctionComponent<ItemsContainerProps> = ({ getCurrentViewStyle, query, items = [], noItemsMessage }: ItemsContainerProps) => {
    const element = useRef<HTMLDivElement>(null);
    const viewStyle = getCurrentViewStyle();

    useEffect(() => {
        let html;

        if (viewStyle == 'Thumb') {
            html = cardBuilder.getCardsHtml(items, {
                items: items,
                shape: 'backdrop',
                preferThumb: true,
                context: 'movies',
                lazy: true,
                overlayPlayButton: true,
                showTitle: true,
                showYear: true,
                centerText: true
            });
        } else if (viewStyle == 'ThumbCard') {
            html = cardBuilder.getCardsHtml(items, {
                items: items,
                shape: 'backdrop',
                preferThumb: true,
                context: 'movies',
                lazy: true,
                cardLayout: true,
                showTitle: true,
                showYear: true,
                centerText: true
            });
        } else if (viewStyle == 'Banner') {
            html = cardBuilder.getCardsHtml(items, {
                items: items,
                shape: 'banner',
                preferBanner: true,
                context: 'movies',
                lazy: true
            });
        } else if (viewStyle == 'List') {
            html = listview.getListViewHtml({
                items: items,
                context: 'movies',
                sortBy: query.SortBy
            });
        } else if (viewStyle == 'PosterCard') {
            html = cardBuilder.getCardsHtml(items, {
                items: items,
                shape: 'portrait',
                context: 'movies',
                showTitle: true,
                showYear: true,
                centerText: true,
                lazy: true,
                cardLayout: true
            });
        } else {
            html = cardBuilder.getCardsHtml(items, {
                items: items,
                shape: 'portrait',
                context: 'movies',
                overlayPlayButton: true,
                showTitle: true,
                showYear: true,
                centerText: true
            });
        }

        if (!items?.length) {
            html = '';

            html += '<div class="noItemsMessage centerMessage">';
            html += '<h1>' + globalize.translate('MessageNothingHere') + '</h1>';
            html += '<p>' + globalize.translate(noItemsMessage) + '</p>';
            html += '</div>';
        }

        const itemsContainer = element.current?.querySelector('.itemsContainer') as HTMLDivElement;
        itemsContainer.innerHTML = html;
        imageLoader.lazyChildren(itemsContainer);
    }, [query.SortBy, items, noItemsMessage, viewStyle]);

    const cssClass = viewStyle == 'List' ? 'vertical-list' : 'vertical-wrap';

    return (
        <div ref={element}>
            <ItemsContainerElement
                className={`itemsContainer ${cssClass} centered padded-left padded-right`}
            />
        </div>
    );
};

export default ItemsContainer;
