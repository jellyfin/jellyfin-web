import React, { FC, useEffect, useRef } from 'react';

import ItemsContainerElement from '../../elements/ItemsContainerElement';
import imageLoader from '../images/imageLoader';
import '../../elements/emby-itemscontainer/emby-itemscontainer';
import { ViewQuerySettings } from '../../types/interface';

interface ItemsContainerI {
    viewQuerySettings: ViewQuerySettings;
    getItemsHtml: () => string
}

const ItemsContainer: FC<ItemsContainerI> = ({ viewQuerySettings, getItemsHtml }) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const itemsContainer = element.current?.querySelector('.itemsContainer') as HTMLDivElement;
        itemsContainer.innerHTML = getItemsHtml();
        imageLoader.lazyChildren(itemsContainer);
    }, [getItemsHtml]);

    const cssClass = viewQuerySettings.imageType == 'list' ? 'vertical-list' : 'vertical-wrap';

    return (
        <div ref={element}>
            <ItemsContainerElement
                className={`itemsContainer ${cssClass} centered padded-left padded-right padded-right-withalphapicker`}
            />
        </div>
    );
};

export default ItemsContainer;
