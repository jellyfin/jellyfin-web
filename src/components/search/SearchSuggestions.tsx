import React, { type FC } from 'react';
import { useSearchSuggestions } from 'hooks/searchHook';
import Loading from 'components/loading/LoadingComponent';
import { appRouter } from '../router/appRouter';
import globalize from '../../scripts/globalize';
import LinkButton from 'elements/emby-button/LinkButton';
import '../../elements/emby-button/emby-button';

interface SearchSuggestionsProps {
    parentId?: string;
}

const SearchSuggestions: FC<SearchSuggestionsProps> = ({ parentId }) => {
    const { isLoading, data: suggestions } = useSearchSuggestions(parentId);

    if (isLoading) return <Loading />;

    return (
        <div
            className='verticalSection searchSuggestions'
            style={{ textAlign: 'center' }}
        >
            <div>
                <h2 className='sectionTitle padded-left padded-right'>
                    {globalize.translate('Suggestions')}
                </h2>
            </div>

            <div className='searchSuggestionsList padded-left padded-right'>
                {suggestions?.map((item) => (
                    <div key={`suggestion-${item.Id}`}>
                        <LinkButton
                            className='button-link'
                            href={appRouter.getRouteUrl(item)}
                            style={{
                                display: 'inline-block',
                                padding: '0.5em 1em'
                            }}
                        >
                            {item.Name}
                        </LinkButton>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SearchSuggestions;
