import React, { type FunctionComponent } from 'react';

import Loading from 'components/loading/LoadingComponent';
import { appRouter } from 'components/router/appRouter';
import { useSearchSuggestions } from '../api/useSearchSuggestions';
import globalize from 'lib/globalize';
import { Button } from 'ui-primitives';

interface SearchSuggestionsProps {
    parentId?: string | null;
}

const SearchSuggestions: FunctionComponent<SearchSuggestionsProps> = ({ parentId }) => {
    const { data: suggestions, isPending } = useSearchSuggestions(parentId || undefined);

    if (isPending) return <Loading />;

    return (
        <div className="verticalSection searchSuggestions" style={{ textAlign: 'center' }}>
            <div>
                <h2 className="sectionTitle padded-left padded-right">{globalize.translate('Suggestions')}</h2>
            </div>

            <div className="searchSuggestionsList padded-left padded-right">
                {suggestions?.map(item => (
                    <div key={item.Id}>
                        <Button
                            component="a"
                            className="button-link"
                            style={{ display: 'inline-block', padding: '0.5em 1em' }}
                            href={appRouter.getRouteUrl(item)}
                        >
                            {item.Name}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SearchSuggestions;
