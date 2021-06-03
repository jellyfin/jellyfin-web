import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import cardBuilder from '../cardbuilder/cardBuilder';

// There seems to be some compatibility issues here between
// React and our legacy web components, so we need to inject
// them as an html string for now =/
const createScroller = ({ title = '' }) => ({
    __html: `<h2 class="sectionTitle sectionTitle-cards focuscontainer-x padded-left padded-right">${title}</h2>
    <div is="emby-scroller" data-horizontal="true" data-centerfocus="card" class="padded-top-focusscale padded-bottom-focusscale">
    <div is="emby-itemscontainer" class="focuscontainer-x itemsContainer scrollSlider"></div>
</div>`
});

const SearchResultsRow = ({ title, items = [], cardOptions = {} }) => {
    const element = useRef(null);

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
    }, [ items ]);

    return (
        <div
            ref={element}
            className='verticalSection'
            dangerouslySetInnerHTML={createScroller({ title })}
        />
    );
};

SearchResultsRow.propTypes = {
    title: PropTypes.string,
    items: PropTypes.array,
    cardOptions: PropTypes.object
};

export default SearchResultsRow;
