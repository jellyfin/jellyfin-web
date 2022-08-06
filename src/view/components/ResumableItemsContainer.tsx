import '../../elements/emby-itemscontainer/emby-itemscontainer';

import { BaseItemDtoQueryResult } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent, useEffect, useRef } from 'react';

import cardBuilder from '../../components/cardbuilder/cardBuilder';
import globalize from '../../scripts/globalize';
import ItemsContainerElement from '../../elements/ItemsContainerElement';

type ResumableItemsContainerProps = {
    getThumbShape: () => string;
    enableScrollX: () => boolean;
    itemsResult?: BaseItemDtoQueryResult;
}

const ResumableItemsContainer: FunctionComponent<ResumableItemsContainerProps> = ({ getThumbShape, enableScrollX, itemsResult = {} }: ResumableItemsContainerProps) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const section = element.current?.querySelector('#resumableSection') as HTMLDivElement;
        if (itemsResult.Items?.length) {
            section.classList.remove('hide');
        } else {
            section.classList.add('hide');
        }

        const allowBottomPadding = !enableScrollX();
        const container = element.current?.querySelector('#resumableItems') as HTMLDivElement;
        cardBuilder.buildCards(itemsResult.Items || [], {
            itemsContainer: container,
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

                <ItemsContainerElement
                    id='resumableItems'
                    className='itemsContainer padded-left padded-right'
                />

            </div>
        </div>
    );
};

export default ResumableItemsContainer;
