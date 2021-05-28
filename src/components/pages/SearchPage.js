import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { Events } from 'jellyfin-apiclient';

import SearchFields from '../search/searchfields';
import SearchResults from '../search/searchresults';

const SearchPage = ({ serverId, parentId, collectionType }) => {
    const [ searchFields, setSearchFields ] = useState(null);
    const searchFieldsContainer = useRef(null);
    const [ searchResults, setSearchResults ] = useState(null);
    const searchResultsContainer = useRef(null);

    useEffect(() => {
        if (!searchFields) {
            setSearchFields(
                new SearchFields({
                    element: searchFieldsContainer.current
                })
            );

            setSearchResults(
                new SearchResults({
                    element: searchResultsContainer.current,
                    serverId: serverId || ApiClient.serverId(),
                    parentId,
                    collectionType
                })
            );
        }

        return () => {
            searchFields?.destroy();
            searchResults?.destroy();
        };
    }, []);

    useEffect(() => {
        if (searchFields) {
            Events.on(searchFields, 'search', (e, value) => {
                searchResults.search(value);
            });
        }
    }, [ searchFields ]);

    return (
        <>
            <div
                className='padded-left padded-right searchFields'
                ref={searchFieldsContainer}
            />
            <div
                className='searchResults padded-bottom-page padded-top'
                ref={searchResultsContainer}
            />
        </>
    );
};

SearchPage.propTypes = {
    serverId: PropTypes.string,
    parentId: PropTypes.string,
    collectionType: PropTypes.string
};

export default SearchPage;
