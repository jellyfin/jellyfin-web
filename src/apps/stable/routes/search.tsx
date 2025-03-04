import React, { type FC, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounceValue } from 'usehooks-ts';
import { usePrevious } from 'hooks/usePrevious';
import globalize from 'lib/globalize';
import Page from 'components/Page';
import SearchFields from 'apps/stable/features/search/components/SearchFields';
import SearchSuggestions from 'apps/stable/features/search/components/SearchSuggestions';
import SearchResults from 'apps/stable/features/search/components/SearchResults';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

const COLLECTION_TYPE_PARAM = 'collectionType';
const PARENT_ID_PARAM = 'parentId';
const QUERY_PARAM = 'query';

const Search: FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const parentIdQuery = searchParams.get(PARENT_ID_PARAM) || undefined;
    const collectionTypeQuery = (searchParams.get(COLLECTION_TYPE_PARAM) || undefined) as CollectionType | undefined;
    const urlQuery = searchParams.get(QUERY_PARAM) || '';
    const [query, setQuery] = useState(urlQuery);
    const prevQuery = usePrevious(query, '');
    const [debouncedQuery] = useDebounceValue(query, 500);

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
            {!query ? (
                <SearchSuggestions
                    parentId={parentIdQuery}
                />
            ) : (
                <SearchResults
                    parentId={parentIdQuery}
                    collectionType={collectionTypeQuery}
                    query={debouncedQuery}
                />
            )}
        </Page>
    );
};

export default Search;
