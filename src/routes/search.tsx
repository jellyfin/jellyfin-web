import React, { FunctionComponent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Page from '../components/Page';
import SearchFields from '../components/search/SearchFields';
import SearchResults from '../components/search/SearchResults';
import SearchSuggestions from '../components/search/SearchSuggestions';
import LiveTVSearchResults from '../components/search/LiveTVSearchResults';
import globalize from '../scripts/globalize';

const SearchPage: FunctionComponent = () => {
    const [ query, setQuery ] = useState<string>();
    const [ searchParams ] = useSearchParams();

    return (
        <Page title={globalize.translate('Search')} className='mainAnimatedPage libraryPage allLibraryPage noSecondaryNavPage'>
            <SearchFields onSearch={setQuery} />
            {!query &&
                <SearchSuggestions
                    serverId={searchParams.get('serverId') || window.ApiClient.serverId()}
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

export default SearchPage;
