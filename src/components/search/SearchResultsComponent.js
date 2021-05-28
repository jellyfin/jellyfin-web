import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

import SearchResults from './searchresults';

const SearchResultsComponent = ({ serverId, parentId, collectionType, query }) => {
    const [ searchResults, setSearchResults ] = useState(null);
    const searchResultsElement = useRef(null);

    useEffect(() => {
        setSearchResults(
            new SearchResults({
                element: searchResultsElement.current,
                serverId: serverId || ApiClient.serverId(),
                parentId,
                collectionType
            })
        );

        return () => {
            searchResults?.destroy();
        };
    }, []);

    useEffect(() => {
        searchResults?.search(query);
    }, [ query ]);

    return (
        <div
            className='searchResults padded-bottom-page padded-top'
            ref={searchResultsElement}
        />
    );
};

SearchResultsComponent.propTypes = {
    serverId: PropTypes.string,
    parentId: PropTypes.string,
    collectionType: PropTypes.string,
    query: PropTypes.string
};

export default SearchResultsComponent;
