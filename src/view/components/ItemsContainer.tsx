import React, { FC, useEffect, useRef } from 'react';

import ItemsContainerElement from '../../elements/ItemsContainerElement';
import imageLoader from '../../components/images/imageLoader';
import '../../elements/emby-itemscontainer/emby-itemscontainer';
import { ViewSettingsI } from './interface';

interface ItemsContainerI {
   viewSettings: ViewSettingsI;
   getItemsHtml: () => string
}

const ItemsContainer: FC<ItemsContainerI> = ({ viewSettings, getItemsHtml }) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const itemsContainer = element.current?.querySelector('.itemsContainer') as HTMLDivElement;
        itemsContainer.innerHTML = getItemsHtml();
        imageLoader.lazyChildren(itemsContainer);
    }, [getItemsHtml]);

    const cssClass = viewSettings.imageType == 'list' ? 'vertical-list' : 'vertical-wrap';

    return (
        <div ref={element}>
            <ItemsContainerElement
                className={`itemsContainer ${cssClass} centered padded-left padded-right padded-right-withalphapicker`}
            />
        </div>
    );
};

export default ItemsContainer;
