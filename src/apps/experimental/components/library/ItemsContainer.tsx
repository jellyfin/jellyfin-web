import { ImageType, type BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useEffect, useCallback, useRef } from 'react';
import globalize from 'scripts/globalize';
import cardBuilder from 'components/cardbuilder/cardBuilder';
import listview from 'components/listview/listview';
import imageLoader from 'components/images/imageLoader';
import ItemsContainerElement from 'elements/ItemsContainerElement';
import 'elements/emby-itemscontainer/emby-itemscontainer';
import { LibraryViewSettings, ViewMode } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import { CollectionType } from 'types/collectionType';
import { CardOptions } from 'types/cardOptions';

interface ItemsContainerI {
    libraryViewSettings: LibraryViewSettings;
    viewType: LibraryTab;
    collectionType?: CollectionType;
    items: BaseItemDto[];
}

const ItemsContainer: FC<ItemsContainerI> = ({ libraryViewSettings, viewType, collectionType, items }) => {
    const element = useRef<HTMLDivElement>(null);

    const getCardOptions = useCallback(() => {
        let shape;
        let preferThumb;
        let preferDisc;
        let preferLogo;
        let lines = libraryViewSettings.ShowTitle ? 2 : 0;

        if (libraryViewSettings.ImageType === ImageType.Banner) {
            shape = 'banner';
        } else if (libraryViewSettings.ImageType === ImageType.Disc) {
            shape = 'square';
            preferDisc = true;
        } else if (libraryViewSettings.ImageType === ImageType.Logo) {
            shape = 'backdrop';
            preferLogo = true;
        } else if (libraryViewSettings.ImageType === ImageType.Thumb || viewType === LibraryTab.Networks) {
            shape = 'backdrop';
            preferThumb = true;
        } else {
            shape = 'auto';
        }

        const cardOptions: CardOptions = {
            shape: shape,
            showTitle: libraryViewSettings.ShowTitle,
            showYear: libraryViewSettings.ShowYear,
            cardLayout: libraryViewSettings.CardLayout,
            centerText: true,
            context: collectionType,
            coverImage: true,
            preferThumb: preferThumb,
            preferDisc: preferDisc,
            preferLogo: preferLogo,
            overlayPlayButton: false,
            overlayMoreButton: true,
            overlayText: !libraryViewSettings.ShowTitle
        };

        if (
            viewType === LibraryTab.Songs
            || viewType === LibraryTab.Albums
            || viewType === LibraryTab.Episodes
        ) {
            cardOptions.showParentTitle = libraryViewSettings.ShowTitle;
        } else if (viewType === LibraryTab.Artists) {
            cardOptions.showYear = false;
            lines = 1;
        }

        cardOptions.lines = lines;
        cardOptions.items = items;

        return cardOptions;
    }, [
        viewType,
        collectionType,
        items,
        libraryViewSettings.CardLayout,
        libraryViewSettings.ImageType,
        libraryViewSettings.ShowTitle,
        libraryViewSettings.ShowYear
    ]);

    const getItemsHtml = useCallback(() => {
        let html = '';

        if (libraryViewSettings.ViewMode === ViewMode.ListView) {
            html = listview.getListViewHtml({
                items: items,
                context: collectionType
            });
        } else {
            html = cardBuilder.getCardsHtml(
                items,
                getCardOptions()
            );
        }

        if (!items.length) {
            html += '<div class="noItemsMessage centerMessage">';
            html
                += '<h1>' + globalize.translate('MessageNothingHere') + '</h1>';
            html += '<p>' + globalize.translate('MessageNoItemsAvailable') + '</p>';
            html += '</div>';
        }

        return html;
    }, [
        getCardOptions,
        collectionType,
        items,
        libraryViewSettings.ViewMode
    ]);

    useEffect(() => {
        const itemsContainer = element.current?.querySelector('.itemsContainer') as HTMLDivElement;
        itemsContainer.innerHTML = getItemsHtml();
        imageLoader.lazyChildren(itemsContainer);
    }, [getItemsHtml]);

    const cssClass = libraryViewSettings.ViewMode === ViewMode.ListView ? 'vertical-list' : 'vertical-wrap';

    return (
        <div ref={element}>
            <ItemsContainerElement
                className={`itemsContainer ${cssClass} centered padded-left padded-right padded-right-withalphapicker`}
            />
        </div>
    );
};

export default ItemsContainer;
