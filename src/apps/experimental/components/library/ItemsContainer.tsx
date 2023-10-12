import React, { FC, useEffect, useRef } from 'react';

import ItemsContainerElement from 'elements/ItemsContainerElement';
import imageLoader from 'components/images/imageLoader';
import 'elements/emby-itemscontainer/emby-itemscontainer';
import { LibraryViewSettings, ViewMode } from 'types/library';

interface ItemsContainerI {
    libraryViewSettings: LibraryViewSettings;
    getItemsHtml: () => string
}

const ItemsContainer: FC<ItemsContainerI> = ({ libraryViewSettings, getItemsHtml }) => {
    const element = useRef<HTMLDivElement>(null);

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
