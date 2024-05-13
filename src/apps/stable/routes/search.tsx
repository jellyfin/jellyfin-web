import React, { type FC, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Page from 'components/Page';
import SearchFields from 'components/search/SearchFields';
import SearchResults from 'components/search/SearchResults';
import SearchSuggestions from 'components/search/SearchSuggestions';
import LiveTVSearchResults from 'components/search/LiveTVSearchResults';
import { usePrevious } from 'hooks/usePrevious';
import globalize from 'scripts/globalize';

const COLLECTION_TYPE_PARAM = 'collectionType';
const PARENT_ID_PARAM = 'parentId';
const QUERY_PARAM = 'query';
const SERVER_ID_PARAM = 'serverId';

const Search: FC = () => {
    const [ searchParams, setSearchParams ] = useSearchParams();
    const urlQuery = searchParams.get(QUERY_PARAM) || '';
    const [ query, setQuery ] = useState(urlQuery);
    const prevQuery = usePrevious(query, '');

    useEffect(() => {
        if (query !== prevQuery) {
            if (query === '' && urlQuery !== '') {
                // The query input has been cleared; remove the url param
                searchParams.delete(QUERY_PARAM);
                setSearchParams(searchParams, { replace: true });
            } else if (query !== urlQuery) {
                // Update the query url param value
                searchParams.set(QUERY_PARAM, query);
                setSearchParams(searchParams, { replace: true });
            }
        } else if (query !== urlQuery) {
            // Update the query if the query url param has changed
            if (!urlQuery) {
                searchParams.delete(QUERY_PARAM);
                setSearchParams(searchParams, { replace: true });
            }

            setQuery(urlQuery);
        }
    }, [query, prevQuery, searchParams, setSearchParams, urlQuery]);

    return (
        <Page
            id='searchPage'
            title={globalize.translate('Search')}
            className='mainAnimatedPage libraryPage allLibraryPage noSecondaryNavPage'
        >
            <SearchFields query={query} onSearch={setQuery} />
            {!query
                && <SearchSuggestions
                    parentId={searchParams.get(PARENT_ID_PARAM)}
                />
            }
            <SearchResults
                serverId={searchParams.get(SERVER_ID_PARAM) || window.ApiClient.serverId()}
                parentId={searchParams.get(PARENT_ID_PARAM)}
                collectionType={searchParams.get(COLLECTION_TYPE_PARAM)}
                query={query}
            />
            <LiveTVSearchResults
                serverId={searchParams.get(SERVER_ID_PARAM) || window.ApiClient.serverId()}
                parentId={searchParams.get(PARENT_ID_PARAM)}
                collectionType={searchParams.get(COLLECTION_TYPE_PARAM)}
                query={query}
            />
        </Page>
    );
};

export default Search;
