import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FunctionComponent, useEffect, useRef } from 'react';

import cardBuilder from '../cardbuilder/cardBuilder';

import '../../elements/emby-scroller/emby-scroller';
import '../../elements/emby-itemscontainer/emby-itemscontainer';

// There seems to be some compatibility issues here between
// React and our legacy web components, so we need to inject
// them as an html string for now =/
const createScroller = ({ title = '' }) => ({
    __html: `<h2 class="sectionTitle sectionTitle-cards focuscontainer-x padded-left padded-right">${title}</h2>
    <div is="emby-scroller" data-horizontal="true" data-centerfocus="card" class="padded-top-focusscale padded-bottom-focusscale">
    <div is="emby-itemscontainer" class="focuscontainer-x itemsContainer scrollSlider"></div>
</div>`
});

type CardOptions = {
    itemsContainer?: HTMLElement,
    parentContainer?: HTMLElement,
    allowBottomPadding?: boolean,
    centerText?: boolean,
    coverImage?: boolean,
    inheritThumb?: boolean,
    overlayMoreButton?: boolean,
    overlayText?: boolean,
    preferThumb?: boolean,
    scalable?: boolean,
    shape?: string,
    showParentTitle?: boolean,
    showParentTitleOrTitle?: boolean,
    showAirTime?: boolean,
    showAirDateTime?: boolean,
    showChannelName?: boolean,
    showTitle?: boolean,
    showYear?: boolean
};

type SearchResultsRowProps = {
    title?: string;
    items?: BaseItemDto[];
    cardOptions?: CardOptions;
};

const SearchResultsRow: FunctionComponent<SearchResultsRowProps> = ({ title, items = [], cardOptions = {} }: SearchResultsRowProps) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        cardBuilder.buildCards(items, {
            itemsContainer: element.current?.querySelector('.itemsContainer'),
            parentContainer: element.current,
            shape: 'autooverflow',
            scalable: true,
            showTitle: true,
            overlayText: false,
            centerText: true,
            allowBottomPadding: false,
            ...cardOptions
        });
    }, [cardOptions, items]);

    return (
        <div
            ref={element}
            className='verticalSection'
            dangerouslySetInnerHTML={createScroller({ title })}
        />
    );
};

export default SearchResultsRow;
