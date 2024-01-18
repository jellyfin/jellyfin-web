import type { BaseItemDto, TimerInfoDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useEffect, useRef } from 'react';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import ItemsContainer from 'elements/emby-itemscontainer/ItemsContainer';
import Scroller from 'elements/emby-scroller/Scroller';
import LinkButton from 'elements/emby-button/LinkButton';
import imageLoader from 'components/images/imageLoader';

import { CardOptions } from 'types/cardOptions';

interface SectionContainerProps {
    url?: string;
    sectionTitle: string;
    items: BaseItemDto[] | TimerInfoDto[];
    cardOptions: CardOptions;
}

const SectionContainer: FC<SectionContainerProps> = ({
    sectionTitle,
    url,
    items,
    cardOptions
}) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const itemsContainer = element.current?.querySelector('.itemsContainer');
        cardBuilder.buildCards(items, {
            itemsContainer: itemsContainer,
            parentContainer: element.current,

            ...cardOptions
        });

        imageLoader.lazyChildren(itemsContainer);
    }, [cardOptions, items]);

    return (
        <div ref={element} className='verticalSection hide'>
            <div className='sectionTitleContainer sectionTitleContainer-cards padded-left'>
                {url && items.length > 5 ? (
                    <LinkButton
                        className='more button-flat button-flat-mini sectionTitleTextButton btnMoreFromGenre'
                        href={url}
                    >
                        <h2 className='sectionTitle sectionTitle-cards'>
                            {sectionTitle}
                        </h2>
                        <span
                            className='material-icons chevron_right'
                            aria-hidden='true'
                        ></span>
                    </LinkButton>
                ) : (
                    <h2 className='sectionTitle sectionTitle-cards'>
                        {sectionTitle}
                    </h2>
                )}
            </div>

            <Scroller
                className='padded-top-focusscale padded-bottom-focusscale'
                isMouseWheelEnabled={false}
                isCenterFocusEnabled={true}
            >
                <ItemsContainer
                    className='itemsContainer scrollSlider focuscontainer-x'
                />
            </Scroller>
        </div>
    );
};

export default SectionContainer;
