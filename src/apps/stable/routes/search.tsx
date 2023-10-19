import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Page from '../../../components/Page';
import SearchFields from '../../../components/search/SearchFields';
import SearchResults from '../../../components/search/SearchResults';
import SearchSuggestions from '../../../components/search/SearchSuggestions';
import LiveTVSearchResults from '../../../components/search/LiveTVSearchResults';
import globalize from '../../../scripts/globalize';
import { history } from '../../../components/router/appRouter';

function usePrevious(value: string) {
    const ref = useRef<string>('');
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

const Search: FunctionComponent = () => {
    const [ searchParams ] = useSearchParams();
    const [ query, setQuery ] = useState<string>(searchParams.get('query') || '');
    const prevQuery = usePrevious(query);

    if (query == prevQuery && searchParams.get('query') != query) {
        setQuery(searchParams.get('query') || '');
    }

    useEffect(() => {
        const newSearch = query ? `?query=${query}` : '';
        if (query != prevQuery && newSearch != history.location.search) {
            /* Explicitly using `window.history.pushState` instead of `history.replace` as the use of the latter
            triggers a re-rendering of this component, resulting in double-execution searches. If there's a
            way to use `history` without this side effect, it would likely be preferable. */
            window.history.pushState({}, '', `/#${history.location.pathname}${newSearch}`);
        }
    }, [query, prevQuery]);

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
