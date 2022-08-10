import '../../elements/emby-itemscontainer/emby-itemscontainer';

import { BaseItemDtoQueryResult } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent, useEffect, useRef } from 'react';

import cardBuilder from '../../components/cardbuilder/cardBuilder';
import globalize from '../../scripts/globalize';
import ItemsContainerElement from '../../elements/ItemsContainerElement';
import ItemsScrollerContainerElement from '../../elements/ItemsScrollerContainerElement';

type ResumableItemsContainerProps = {
    getThumbShape: () => string;
    enableScrollX: () => boolean;
    itemsResult?: BaseItemDtoQueryResult;
}

const ResumableItemsContainer: FunctionComponent<ResumableItemsContainerProps> = ({ getThumbShape, enableScrollX, itemsResult = {} }: ResumableItemsContainerProps) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const allowBottomPadding = !enableScrollX();
        cardBuilder.buildCards(itemsResult.Items || [], {
            itemsContainer: element.current?.querySelector('.itemsContainer'),
            parentContainer: element.current?.querySelector('#resumableSection'),
            preferThumb: true,
            shape: getThumbShape(),
            scalable: true,
            overlayPlayButton: true,
            allowBottomPadding: allowBottomPadding,
            cardLayout: false,
            showTitle: true,
            showYear: true,
            centerText: true
        });
    }, [enableScrollX, getThumbShape, itemsResult.Items]);

    return (
        <div ref={element}>
            <div id='resumableSection' className='verticalSection hide'>
                <div className='sectionTitleContainer sectionTitleContainer-cards'>
                    <h2 className='sectionTitle sectionTitle-cards padded-left'>
                        {globalize.translate('HeaderContinueWatching')}
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

export default ResumableItemsContainer;
