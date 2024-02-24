import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import React, { FunctionComponent, useEffect, useState } from 'react';

import { appRouter } from '../router/appRouter';
import { useApi } from '../../hooks/useApi';
import globalize from '../../scripts/globalize';
import LinkButton from '../../elements/emby-button/LinkButton';

import '../../elements/emby-button/emby-button';

type SearchSuggestionsProps = {
    parentId?: string | null;
};

const SearchSuggestions: FunctionComponent<SearchSuggestionsProps> = ({ parentId }: SearchSuggestionsProps) => {
    const [ suggestions, setSuggestions ] = useState<BaseItemDto[]>([]);
    const { api, user } = useApi();

    useEffect(() => {
        if (api && user?.Id) {
            getItemsApi(api)
                .getItemsByUserId({
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
                    <LinkButton key={item.Id}
                        className='button-link'
                        style={{ display: 'inline-block', padding: '0.5em 1em' }}
                        href={appRouter.getRouteUrl(item)}>
                        {item.Name}
                    </LinkButton>
                ))}
            </div>
        </div>
    );
};

export default SearchSuggestions;
