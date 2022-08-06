import '../../elements/emby-itemscontainer/emby-itemscontainer';

import { BaseItemDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent, useEffect, useRef } from 'react';

import cardBuilder from '../../components/cardbuilder/cardBuilder';
import globalize from '../../scripts/globalize';
import ItemsContainerElement from '../../elements/ItemsContainerElement';

type RecentlyAddedItemsContainerProps = {
    getPortraitShape: () => string;
    enableScrollX: () => boolean;
    items?: BaseItemDto[];
}

const RecentlyAddedItemsContainer: FunctionComponent<RecentlyAddedItemsContainerProps> = ({ getPortraitShape, enableScrollX, items = [] }: RecentlyAddedItemsContainerProps) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const section = element.current?.querySelector('#recentlyAddedItemsSection') as HTMLDivElement;
        if (items?.length) {
            section.classList.remove('hide');
        } else {
            section.classList.add('hide');
        }

        const allowBottomPadding = !enableScrollX();
        const container = element.current?.querySelector('#recentlyAddedItems');
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
    }, [enableScrollX, getPortraitShape, items]);

    return (
        <div ref={element}>
            <div id='recentlyAddedItemsSection' className='verticalSection hide'>
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
        </div>
    );
};

export default RecentlyAddedItemsContainer;
