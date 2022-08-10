import '../../elements/emby-itemscontainer/emby-itemscontainer';

import { BaseItemDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent, useEffect, useRef } from 'react';

import cardBuilder from '../../components/cardbuilder/cardBuilder';
import globalize from '../../scripts/globalize';
import ItemsContainerElement from '../../elements/ItemsContainerElement';
import ItemsScrollerContainerElement from '../../elements/ItemsScrollerContainerElement';

type RecentlyAddedItemsContainerProps = {
    getPortraitShape: () => string;
    enableScrollX: () => boolean;
    items?: BaseItemDto[];
}

const RecentlyAddedItemsContainer: FunctionComponent<RecentlyAddedItemsContainerProps> = ({ getPortraitShape, enableScrollX, items = [] }: RecentlyAddedItemsContainerProps) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        cardBuilder.buildCards(items, {
            itemsContainer: element.current?.querySelector('.itemsContainer'),
            parentContainer: element.current?.querySelector('#recentlyAddedItemsSection'),
            shape: getPortraitShape(),
            scalable: true,
            overlayPlayButton: true,
            allowBottomPadding: true,
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

                {enableScrollX() ? <ItemsScrollerContainerElement
                    scrollerclassName='padded-top-focusscale padded-bottom-focusscale'
                    dataMousewheel='false'
                    dataCenterfocus='true'
                    className='itemsContainer scrollSlider focuscontainer-x'
                /> : <ItemsContainerElement
                    className='itemsContainer focuscontainer-x padded-left padded-right vertical-wrap'
                />}

            </div>
        </div>
    );
};

export default RecentlyAddedItemsContainer;
