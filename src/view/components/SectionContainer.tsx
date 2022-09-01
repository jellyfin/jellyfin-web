import '../../elements/emby-itemscontainer/emby-itemscontainer';

import { BaseItemDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent, useEffect, useRef } from 'react';

import cardBuilder from '../../components/cardbuilder/cardBuilder';
import ItemsContainerElement from '../../elements/ItemsContainerElement';
import ItemsScrollerContainerElement from '../../elements/ItemsScrollerContainerElement';
import { ICardOptions } from './type';

type SectionContainerProps = {
    sectionTitle: string;
    enableScrollX: () => boolean;
    items?: BaseItemDto[];
    cardOptions?: ICardOptions;
}

const SectionContainer: FunctionComponent<SectionContainerProps> = ({
    sectionTitle,
    enableScrollX,
    items = [],
    cardOptions = {}
}: SectionContainerProps) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        cardBuilder.buildCards(items, {
            itemsContainer: element.current?.querySelector('.itemsContainer'),
            parentContainer: element.current?.querySelector('.verticalSection'),
            scalable: true,
            overlayPlayButton: true,
            showTitle: true,
            centerText: true,
            cardLayout: false,
            ...cardOptions
        });
    }, [cardOptions, enableScrollX, items]);

    return (
        <div ref={element}>
            <div className='verticalSection hide'>
                <div className='sectionTitleContainer sectionTitleContainer-cards'>
                    <h2 className='sectionTitle sectionTitle-cards padded-left'>
                        {sectionTitle}
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

export default SectionContainer;
