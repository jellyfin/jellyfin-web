import { Events } from 'jellyfin-apiclient';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

import SearchFields from './searchfields';

const SearchFieldsComponent = ({ onSearch = () => {} }) => {
    const [ searchFields, setSearchFields ] = useState(null);
    const searchFieldsElement = useRef(null);

    useEffect(() => {
        setSearchFields(
            new SearchFields({ element: searchFieldsElement.current })
        );

        return () => {
            searchFields?.destroy();
        };
    }, []);

    useEffect(() => {
        if (searchFields) {
            Events.on(searchFields, 'search', (e, value) => {
                onSearch(value);
            });
        }
    }, [ searchFields ]);

    return (
        <div
            className='padded-left padded-right searchFields'
            ref={searchFieldsElement}
        />
    );
};

SearchFieldsComponent.propTypes = {
    onSearch: PropTypes.func
};

export default SearchFieldsComponent;
