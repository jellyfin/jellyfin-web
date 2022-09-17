import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import escapeHtml from 'escape-html';
import React, { FunctionComponent, useEffect, useState } from 'react';

import { appRouter } from '../appRouter';
import globalize from '../../scripts/globalize';
import ServerConnections from '../ServerConnections';

import '../../elements/emby-button/emby-button';

// There seems to be some compatibility issues here between
// React and our legacy web components, so we need to inject
// them as an html string for now =/
const createSuggestionLink = ({ name, href }: { name: string, href: string }) => ({
    __html: `<a
    is='emby-linkbutton'
    class='button-link'
    style='display: inline-block; padding: 0.5em 1em;'
    href='${href}'
>${escapeHtml(name)}</a>`
});

type SearchSuggestionsProps = {
    serverId?: string;
    parentId?: string | null;
}

const SearchSuggestions: FunctionComponent<SearchSuggestionsProps> = ({ serverId = window.ApiClient.serverId(), parentId }: SearchSuggestionsProps) => {
    const [ suggestions, setSuggestions ] = useState<BaseItemDto[]>([]);

    useEffect(() => {
        const apiClient = ServerConnections.getApiClient(serverId);

        apiClient.getItems(apiClient.getCurrentUserId(), {
            SortBy: 'IsFavoriteOrLiked,Random',
            IncludeItemTypes: 'Movie,Series,MusicArtist',
            Limit: 20,
            Recursive: true,
            ImageTypeLimit: 0,
            EnableImages: false,
            ParentId: parentId,
            EnableTotalRecordCount: false
        }).then(result => setSuggestions(result.Items || []));
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
                            name: item.Name || '',
                            href: appRouter.getRouteUrl(item)
                        })}
                    />
                ))}
            </div>
        </div>
    );
};

export default SearchSuggestions;
