import React, { FunctionComponent, useState } from 'react';

import SearchFields from '../search/SearchFields';
import SearchResults from '../search/SearchResults';
import SearchSuggestions from '../search/SearchSuggestions';
import LiveTVSearchResults from '../search/LiveTVSearchResults';

type SearchProps = {
    serverId?: string,
    parentId?: string,
    collectionType?: string
};

const SearchPage: FunctionComponent<SearchProps> = ({ serverId, parentId, collectionType }: SearchProps) => {
    const [ query, setQuery ] = useState<string>();

    return (
        <>
            <SearchFields onSearch={setQuery} />
            {!query &&
                <SearchSuggestions
                    serverId={serverId || window.ApiClient.serverId()}
                    parentId={parentId}
                />
            }
            <SearchResults
                serverId={serverId || window.ApiClient.serverId()}
                parentId={parentId}
                collectionType={collectionType}
                query={query}
            />
            <LiveTVSearchResults
                serverId={serverId || window.ApiClient.serverId()}
                parentId={parentId}
                collectionType={collectionType}
                query={query}
            />
        </>
    );
};

export default SearchPage;
