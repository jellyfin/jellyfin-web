import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import escapeHtml from 'escape-html';
import React, { FunctionComponent, useEffect, useState } from 'react';

import { appRouter } from '../router/appRouter';
import { useApi } from '../../hooks/useApi';
import globalize from '../../scripts/globalize';

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
    parentId?: string | null;
};

const SearchSuggestions: FunctionComponent<SearchSuggestionsProps> = ({ parentId }: SearchSuggestionsProps) => {
    const [ suggestions, setSuggestions ] = useState<BaseItemDto[]>([]);
    const { api, user } = useApi();

    useEffect(() => {
        if (api && user?.Id) {
            getItemsApi(api)
                .getItems({
                    userId: user.Id,
                    sortBy: [ItemSortBy.IsFavoriteOrLiked, ItemSortBy.Random],
                    includeItemTypes: [BaseItemKind.Movie, BaseItemKind.Series, BaseItemKind.MusicArtist],
                    limit: 20,
                    recursive: true,
                    imageTypeLimit: 0,
                    enableImages: false,
                    parentId: parentId || undefined,
                    enableTotalRecordCount: false
                })
                .then(result => setSuggestions(result.data.Items || []))
                .catch(err => {
                    console.error('[SearchSuggestions] failed to fetch search suggestions', err);
                    setSuggestions([]);
                });
        }
    }, [ api, parentId, user ]);

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
