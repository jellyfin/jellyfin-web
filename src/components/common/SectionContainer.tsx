import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useEffect, useRef } from 'react';

import cardBuilder from '../cardbuilder/cardBuilder';
import ItemsContainerElement from '../../elements/ItemsContainerElement';
import Scroller from '../../elements/emby-scroller/Scroller';
import { CardOptions } from '../../types/interface';
import { appRouter } from '../appRouter';
import LinkButton from '../../elements/emby-button/LinkButton';
import imageLoader from '../images/imageLoader';

interface SectionContainerProps {
    topParentId?: string | null;
    sectionTitle: string;
    items: BaseItemDto[];
    genre?: BaseItemDto;
    cardOptions: CardOptions;
    getContext?: () => string| null;
}

const SectionContainer: FC<SectionContainerProps> = ({
    topParentId,
    sectionTitle,
    items,
    genre,
    cardOptions,
    getContext
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
                {
                    genre ? (
                        <LinkButton
                            className= 'more button-flat button-flat-mini sectionTitleTextButton btnMoreFromGenre'
                            href= {appRouter.getRouteUrl(genre, {
                                context: getContext?.(),
                                parentId: topParentId
                            })}
                        >
                            <h2 className='sectionTitle sectionTitle-cards'>
                                {sectionTitle}
                            </h2>
                            <span className='material-icons chevron_right' aria-hidden='true'></span>
                        </LinkButton>
                    ) : (
                        <h2 className='sectionTitle sectionTitle-cards'>
                            {sectionTitle}
                        </h2>
                    )
                }
            </div>

            <Scroller
                className='padded-top-focusscale padded-bottom-focusscale'
                isMouseWheelEnabled={false}
                isCenterFocusEnabled={true}
            >
                <ItemsContainerElement
                    className='itemsContainer scrollSlider focuscontainer-x lazy'
                />
            </Scroller>
        </div>
    );
};

export default SectionContainer;
