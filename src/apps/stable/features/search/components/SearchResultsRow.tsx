import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import cardBuilder, { type CardOptions } from 'components/cardbuilder/cardBuilder';
import React, { type FC, useEffect, useRef } from 'react';
import 'elements/emby-scroller/emby-scroller';
import 'elements/emby-itemscontainer/emby-itemscontainer';

// There seems to be some compatibility issues here between
// React and our legacy web components, so we need to inject
// them as an html string for now =/
const createScroller = ({ title = '' }) => ({
    __html: `<h2 class="sectionTitle sectionTitle-cards focuscontainer-x padded-left padded-right">${title}</h2>
    <div is="emby-scroller" data-horizontal="true" data-centerfocus="card" class="padded-top-focusscale padded-bottom-focusscale">
    <div is="emby-itemscontainer" class="focuscontainer-x itemsContainer scrollSlider"></div>
</div>`
});

interface SearchResultsRowProps {
    title?: string;
    items?: BaseItemDto[];
    cardOptions?: CardOptions;
}

const SearchResultsRow: FC<SearchResultsRowProps> = ({ title, items = [], cardOptions = {} }) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = element.current?.querySelector('.itemsContainer') as HTMLElement | null;
        if (!container) return;
        container.innerHTML = cardBuilder.getCardsHtml(items, {
            ...cardOptions,
            itemsContainer: container
        } as any);
    }, [cardOptions, items]);

    return (
        <div
            ref={element}
            className="verticalSection"
            dangerouslySetInnerHTML={createScroller({ title })}
        />
    );
};

export default SearchResultsRow;
