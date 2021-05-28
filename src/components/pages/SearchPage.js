import PropTypes from 'prop-types';
import React, { useState } from 'react';

import SearchFieldsComponent from '../search/SearchFieldsComponent';
import SearchResultsComponent from '../search/SearchResultsComponent';

const SearchPage = ({ serverId, parentId, collectionType }) => {
    const [ query, setQuery ] = useState(null);

    return (
        <>
            <SearchFieldsComponent
                onSearch={setQuery}
            />
            <SearchResultsComponent
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
