import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback, useEffect, useRef } from 'react';

import ItemsContainerElement from '../../elements/ItemsContainerElement';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import listview from '../../components/listview/listview';
import globalize from '../../scripts/globalize';
import imageLoader from '../../components/images/imageLoader';
import '../../elements/emby-itemscontainer/emby-itemscontainer';
import { CardOptionsI } from './interface';

interface ItemsContainerI {
    getViewSettings: () => {
        showTitle: string | boolean;
        cardLayout: string | boolean;
        showYear: string | boolean;
        imageType: string;
        viewType: string;
    };
    getContext: () => string | null;
    items?: BaseItemDto[] | null;
    noItemsMessage?: string;
}

const ItemsContainer: FC<ItemsContainerI> = ({ getViewSettings, getContext, items = [], noItemsMessage }) => {
    const element = useRef<HTMLDivElement>(null);
    const viewsettings = getViewSettings();

    const getCardOptions = useCallback(() => {
        let shape;
        let preferThumb;
        let preferDisc;
        let preferLogo;

        if (viewsettings.imageType === 'banner') {
            shape = 'banner';
        } else if (viewsettings.imageType === 'disc') {
            shape = 'square';
            preferDisc = true;
        } else if (viewsettings.imageType === 'logo') {
            shape = 'backdrop';
            preferLogo = true;
        } else if (viewsettings.imageType === 'thumb') {
            shape = 'backdrop';
            preferThumb = true;
        } else {
            shape = 'autoVertical';
        }

        const cardOptions: CardOptionsI = {
            shape: shape,
            showTitle: viewsettings.showTitle,
            showYear: viewsettings.showYear,
            cardLayout: viewsettings.cardLayout,
            centerText: true,
            context: getContext(),
            coverImage: true,
            preferThumb: preferThumb,
            preferDisc: preferDisc,
            preferLogo: preferLogo,
            overlayPlayButton: false,
            overlayMoreButton: true,
            overlayText: !viewsettings.showTitle
        };

        cardOptions.items = items;

        return cardOptions;
    }, [getContext, items, viewsettings.cardLayout, viewsettings.imageType, viewsettings.showTitle, viewsettings.showYear]);

    const getItemsHtml = useCallback(() => {
        const settings = getViewSettings();

        let html = '';

        if (settings.imageType === 'list') {
            html = listview.getListViewHtml({
                items: items,
                context: getContext()});
        } else {
            html = cardBuilder.getCardsHtml(items, getCardOptions());
        }

        if (!items?.length) {
            html += '<div class="noItemsMessage centerMessage">';
            html += '<h1>' + globalize.translate('MessageNothingHere') + '</h1>';
            html += '<p>' + globalize.translate(noItemsMessage) + '</p>';
            html += '</div>';
        }

        return html;
    }, [getCardOptions, getContext, getViewSettings, items, noItemsMessage]);

    useEffect(() => {
        const itemsContainer = element.current?.querySelector('.itemsContainer') as HTMLDivElement;
        itemsContainer.innerHTML = getItemsHtml();
        imageLoader.lazyChildren(itemsContainer);
    }, [getItemsHtml]);

    const cssClass = viewsettings.imageType == 'List' ? 'vertical-list' : 'vertical-wrap';

    return (
        <div ref={element}>
            <ItemsContainerElement
                className={`itemsContainer ${cssClass} centered padded-left padded-right padded-right-withalphapicker`}
            />
        </div>
    );
};

export default ItemsContainer;
