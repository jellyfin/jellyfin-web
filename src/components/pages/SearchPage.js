import PropTypes from 'prop-types';
import React, { useState } from 'react';

import SearchFields from '../search/SearchFields';
import SearchResults from '../search/SearchResultsComponent';

const SearchPage = ({ serverId, parentId, collectionType }) => {
    const [ query, setQuery ] = useState(null);

    return (
        <>
            <SearchFields onSearch={setQuery} />
            <SearchResults
                serverId={serverId || ApiClient.serverId()}
                parentId={parentId}
                collectionType={collectionType}
                query={query}
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
