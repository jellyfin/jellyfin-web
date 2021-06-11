import PropTypes from 'prop-types';
import React, { FunctionComponent, useEffect, useState } from 'react';

import { appRouter } from '../appRouter';
import globalize from '../../scripts/globalize';
import ServerConnections from '../ServerConnections';

import '../../elements/emby-button/emby-button';

// There seems to be some compatibility issues here between
// React and our legacy web components, so we need to inject
// them as an html string for now =/
const createSuggestionLink = ({name, href}) => ({
    __html: `<a
    is='emby-linkbutton'
    class='button-link'
    style='display: inline-block; padding: 0.5em 1em;'
    href='${href}'
>${name}</a>`
});

type SearchSuggestionsProps = {
    serverId: string;
    parentId: string;
}

const SearchSuggestions: FunctionComponent<SearchSuggestionsProps> = ({ serverId, parentId }) => {
    const [ suggestions, setSuggestions ] = useState([]);

    useEffect(() => {
        // TODO: Remove type casting once we're using a properly typed API client
        const apiClient = (ServerConnections as any).getApiClient(serverId);

        apiClient.getItems(apiClient.getCurrentUserId(), {
            SortBy: 'IsFavoriteOrLiked,Random',
            IncludeItemTypes: 'Movie,Series,MusicArtist',
            Limit: 20,
            Recursive: true,
            ImageTypeLimit: 0,
            EnableImages: false,
            ParentId: parentId,
            EnableTotalRecordCount: false
        }).then(result => setSuggestions(result.Items));
    }, [parentId, serverId]);

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
                {suggestions.map(item => (
                    <div
                        key={`suggestion-${item.Id}`}
                        dangerouslySetInnerHTML={createSuggestionLink({
                            name: item.Name,
                            href: appRouter.getRouteUrl(item)
                        })}
                    />
                ))}
            </div>
        </div>
    );
};

SearchSuggestions.propTypes = {
    parentId: PropTypes.string,
    serverId: PropTypes.string
};

export default SearchSuggestions;
