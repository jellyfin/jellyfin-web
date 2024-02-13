import React, { type FC, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Page from 'components/Page';
import SearchFields from 'components/search/SearchFields';
import SearchResults from 'components/search/SearchResults';
import SearchSuggestions from 'components/search/SearchSuggestions';
import LiveTVSearchResults from 'components/search/LiveTVSearchResults';
import { usePrevious } from 'hooks/usePrevious';
import globalize from 'scripts/globalize';

const Search: FC = () => {
    const navigate = useNavigate();
    const [ searchParams, setSearchParams ] = useSearchParams();
    const urlQuery = searchParams.get('query') || '';
    const [ query, setQuery ] = useState(urlQuery);
    const prevQuery = usePrevious(query, '');

    useEffect(() => {
        if (query !== prevQuery) {
            if (query === '' && urlQuery !== '') {
                // The query input has been cleared; navigate back to the search landing page
                navigate(-1);
            } else if (query !== urlQuery) {
                // Update the query url param value
                searchParams.set('query', query);
                setSearchParams(searchParams, { replace: !!urlQuery });
            }
        } else if (query !== urlQuery) {
            // Update the query if the query url param has changed
            setQuery(urlQuery);
        }
    }, [query, prevQuery, navigate, searchParams, setSearchParams, urlQuery]);

    return (
        <Page
            id='searchPage'
            title={globalize.translate('Search')}
            className='mainAnimatedPage libraryPage allLibraryPage noSecondaryNavPage'
        >
            <SearchFields query={query} onSearch={setQuery} />
            {!query
                && <SearchSuggestions
                    parentId={searchParams.get('parentId')}
                />
            }
            <SearchResults
                serverId={searchParams.get('serverId') || window.ApiClient.serverId()}
                parentId={searchParams.get('parentId')}
                collectionType={searchParams.get('collectionType')}
                query={query}
            />
            <LiveTVSearchResults
                serverId={searchParams.get('serverId') || window.ApiClient.serverId()}
                parentId={searchParams.get('parentId')}
                collectionType={searchParams.get('collectionType')}
                query={query}
            />
        </Page>
    );
};

export default Search;
