import { BaseItemDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FC, useEffect, useRef } from 'react';

import ItemsContainerElement from '../../elements/ItemsContainerElement';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import listview from '../../components/listview/listview';
import globalize from '../../scripts/globalize';
import imageLoader from '../../components/images/imageLoader';
import '../../elements/emby-itemscontainer/emby-itemscontainer';
import { QueryI } from './interface';

interface ItemsContainerI {
    getCurrentViewStyle: () => string;
    query: QueryI;
    getContext: () => string | null;
    items?: BaseItemDto[] | null;
    noItemsMessage?: string;
}

const ItemsContainer: FC<ItemsContainerI> = ({ getCurrentViewStyle, query, getContext, items = [], noItemsMessage }) => {
    const element = useRef<HTMLDivElement>(null);
    const viewStyle = getCurrentViewStyle();

    useEffect(() => {
        let html;

        if (viewStyle == 'Thumb') {
            html = cardBuilder.getCardsHtml(items, {
                items: items,
                shape: 'backdrop',
                preferThumb: true,
                context: getContext(),
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
                context: getContext(),
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
                context: getContext(),
                lazy: true
            });
        } else if (viewStyle == 'List') {
            html = listview.getListViewHtml({
                items: items,
                context: getContext(),
                sortBy: query.SortBy
            });
        } else if (viewStyle == 'PosterCard') {
            html = cardBuilder.getCardsHtml(items, {
                items: items,
                shape: 'portrait',
                context: getContext(),
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
                context: getContext(),
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
    }, [query.SortBy, items, noItemsMessage, viewStyle, getContext]);

    const cssClass = viewStyle == 'List' ? 'vertical-list' : 'vertical-wrap';

    return (
        <div ref={element}>
            <ItemsContainerElement
                className={`itemsContainer ${cssClass} centered padded-left padded-right padded-right-withalphapicker`}
            />
        </div>
    );
};

export default ItemsContainer;
