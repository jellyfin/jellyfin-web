import type { BaseItemDto, TimerInfoDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC } from 'react';

import ItemsContainer from 'elements/emby-itemscontainer/ItemsContainer';
import Scroller from 'elements/emby-scroller/Scroller';
import LinkButton from 'elements/emby-button/LinkButton';
import Cards from 'components/cardbuilder/Card/Cards';
import type { CardOptions } from 'types/cardOptions';

interface SectionContainerProps {
    url?: string;
    sectionTitle: string;
    items: BaseItemDto[] | TimerInfoDto[];
    cardOptions: CardOptions;
    reloadItems?: () => void;
}

const SectionContainer: FC<SectionContainerProps> = ({
    sectionTitle,
    url,
    items,
    cardOptions,
    reloadItems
}) => {
    return (
        <div className='verticalSection'>
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
                    reloadItems={reloadItems}
                    queryKey={cardOptions.queryKey}
                >
                    <Cards items={items} cardOptions={cardOptions} />
                </ItemsContainer>
            </Scroller>
        </div>
    );
};

export default SectionContainer;
