import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import type { ApiClient } from 'jellyfin-apiclient';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import classNames from 'classnames';
import React, { type FC, useCallback, useEffect, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';

import globalize from '../../scripts/globalize';
import ServerConnections from '../ServerConnections';
import SearchResultsRow from './SearchResultsRow';

const CARD_OPTIONS = {
    preferThumb: true,
    inheritThumb: false,
    showParentTitleOrTitle: true,
    showTitle: false,
    coverImage: true,
    overlayMoreButton: true,
    showAirTime: true,
    showAirDateTime: true,
    showChannelName: true
};

type LiveTVSearchResultsProps = {
    serverId?: string;
    parentId?: string | null;
    collectionType?: string | null;
    query?: string;
};

/*
 * React component to display search result rows for live tv library search
 */
const LiveTVSearchResults: FC<LiveTVSearchResultsProps> = ({ serverId = window.ApiClient.serverId(), parentId, collectionType, query }: LiveTVSearchResultsProps) => {
    const [ movies, setMovies ] = useState<BaseItemDto[]>([]);
    const [ episodes, setEpisodes ] = useState<BaseItemDto[]>([]);
    const [ sports, setSports ] = useState<BaseItemDto[]>([]);
    const [ kids, setKids ] = useState<BaseItemDto[]>([]);
    const [ news, setNews ] = useState<BaseItemDto[]>([]);
    const [ programs, setPrograms ] = useState<BaseItemDto[]>([]);
    const [ channels, setChannels ] = useState<BaseItemDto[]>([]);
    const [ debouncedQuery ] = useDebounceValue(query, 500);

    const getDefaultParameters = useCallback(() => ({
        ParentId: parentId,
        searchTerm: debouncedQuery,
        Limit: 24,
        Fields: 'PrimaryImageAspectRatio,CanDelete,MediaSourceCount',
        Recursive: true,
        EnableTotalRecordCount: false,
        ImageTypeLimit: 1,
        IncludePeople: false,
        IncludeMedia: false,
        IncludeGenres: false,
        IncludeStudios: false,
        IncludeArtists: false
    }), [ parentId, debouncedQuery ]);

    useEffect(() => {
        const fetchItems = (apiClient: ApiClient, params = {}) => apiClient?.getItems(
            apiClient?.getCurrentUserId(),
            {
                ...getDefaultParameters(),
                IncludeMedia: true,
                ...params
            }
        );

        // Reset state
        setMovies([]);
        setEpisodes([]);
        setSports([]);
        setKids([]);
        setNews([]);
        setPrograms([]);
        setChannels([]);

        if (!debouncedQuery || collectionType !== CollectionType.Livetv) {
            return;
        }

        const apiClient = ServerConnections.getApiClient(serverId);

        // Movies row
        fetchItems(apiClient, {
            IncludeItemTypes: 'LiveTvProgram',
            IsMovie: true
        })
            .then(result => setMovies(result.Items || []))
            .catch(() => setMovies([]));
        // Episodes row
        fetchItems(apiClient, {
            IncludeItemTypes: 'LiveTvProgram',
            IsMovie: false,
            IsSeries: true,
            IsSports: false,
            IsKids: false,
            IsNews: false
        })
            .then(result => setEpisodes(result.Items || []))
            .catch(() => setEpisodes([]));
        // Sports row
        fetchItems(apiClient, {
            IncludeItemTypes: 'LiveTvProgram',
            IsSports: true
        })
            .then(result => setSports(result.Items || []))
            .catch(() => setSports([]));
        // Kids row
        fetchItems(apiClient, {
            IncludeItemTypes: 'LiveTvProgram',
            IsKids: true
        })
            .then(result => setKids(result.Items || []))
            .catch(() => setKids([]));
        // News row
        fetchItems(apiClient, {
            IncludeItemTypes: 'LiveTvProgram',
            IsNews: true
        })
            .then(result => setNews(result.Items || []))
            .catch(() => setNews([]));
        // Programs row
        fetchItems(apiClient, {
            IncludeItemTypes: 'LiveTvProgram',
            IsMovie: false,
            IsSeries: false,
            IsSports: false,
            IsKids: false,
            IsNews: false
        })
            .then(result => setPrograms(result.Items || []))
            .catch(() => setPrograms([]));
        // Channels row
        fetchItems(apiClient, { IncludeItemTypes: 'TvChannel' })
            .then(result => setChannels(result.Items || []))
            .catch(() => setChannels([]));
    }, [collectionType, debouncedQuery, getDefaultParameters, parentId, serverId]);

    return (
        <div
            className={classNames(
                'searchResults',
                'padded-bottom-page',
                'padded-top',
                { 'hide': !debouncedQuery || collectionType !== CollectionType.Livetv }
            )}
        >
            <SearchResultsRow
                title={globalize.translate('Movies')}
                items={movies}
                cardOptions={{
                    ...CARD_OPTIONS,
                    shape: 'overflowPortrait'
                }}
            />
            <SearchResultsRow
                title={globalize.translate('Episodes')}
                items={episodes}
                cardOptions={CARD_OPTIONS}
            />
            <SearchResultsRow
                title={globalize.translate('Sports')}
                items={sports}
                cardOptions={CARD_OPTIONS}
            />
            <SearchResultsRow
                title={globalize.translate('Kids')}
                items={kids}
                cardOptions={CARD_OPTIONS}
            />
            <SearchResultsRow
                title={globalize.translate('News')}
                items={news}
                cardOptions={CARD_OPTIONS}
            />
            <SearchResultsRow
                title={globalize.translate('Programs')}
                items={programs}
                cardOptions={CARD_OPTIONS}
            />
            <SearchResultsRow
                title={globalize.translate('Channels')}
                items={channels}
                cardOptions={{ shape: 'square' }}
            />
        </div>
    );
};

export default LiveTVSearchResults;
