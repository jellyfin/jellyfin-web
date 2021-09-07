import classNames from 'classnames';
import React, { FunctionComponent, useEffect, useState } from 'react';

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
    parentId?: string;
    collectionType?: string;
    query?: string;
}

/*
 * React component to display search result rows for live tv library search
 */
const LiveTVSearchResults: FunctionComponent<LiveTVSearchResultsProps> = ({ serverId, parentId, collectionType, query }: LiveTVSearchResultsProps) => {
    const [ movies, setMovies ] = useState([]);
    const [ episodes, setEpisodes ] = useState([]);
    const [ sports, setSports ] = useState([]);
    const [ kids, setKids ] = useState([]);
    const [ news, setNews ] = useState([]);
    const [ programs, setPrograms ] = useState([]);
    const [ channels, setChannels ] = useState([]);

    useEffect(() => {
        const getDefaultParameters = () => ({
            ParentId: parentId,
            searchTerm: query,
            Limit: 24,
            Fields: 'PrimaryImageAspectRatio,CanDelete,BasicSyncInfo,MediaSourceCount',
            Recursive: true,
            EnableTotalRecordCount: false,
            ImageTypeLimit: 1,
            IncludePeople: false,
            IncludeMedia: false,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false
        });

        // FIXME: This query does not support Live TV filters
        const fetchItems = (apiClient, params = {}) => apiClient?.getItems(
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

        if (query && collectionType === 'livetv') {
            // TODO: Remove type casting once we're using a properly typed API client
            const apiClient = (ServerConnections as any).getApiClient(serverId);

            // Movies row
            fetchItems(apiClient, {
                IncludeItemTypes: 'LiveTvProgram',
                IsMovie: true,
                IsSeries: false,
                IsSports: false,
                IsKids: false,
                IsNews: false
            }).then(result => setMovies(result.Items));
            // Episodes row
            fetchItems(apiClient, {
                IncludeItemTypes: 'LiveTvProgram',
                IsMovie: false,
                IsSeries: true,
                IsSports: false,
                IsKids: false,
                IsNews: false
            }).then(result => setEpisodes(result.Items));
            // Sports row
            fetchItems(apiClient, {
                IncludeItemTypes: 'LiveTvProgram',
                IsMovie: false,
                IsSeries: false,
                IsSports: true,
                IsKids: false,
                IsNews: false
            }).then(result => setSports(result.Items));
            // Kids row
            fetchItems(apiClient, {
                IncludeItemTypes: 'LiveTvProgram',
                IsMovie: false,
                IsSeries: false,
                IsSports: false,
                IsKids: true,
                IsNews: false
            }).then(result => setKids(result.Items));
            // News row
            fetchItems(apiClient, {
                IncludeItemTypes: 'LiveTvProgram',
                IsMovie: false,
                IsSeries: false,
                IsSports: false,
                IsKids: false,
                IsNews: true
            }).then(result => setNews(result.Items));
            // Programs row
            fetchItems(apiClient, {
                IncludeItemTypes: 'LiveTvProgram',
                IsMovie: false,
                IsSeries: false,
                IsSports: false,
                IsKids: false,
                IsNews: false
            }).then(result => setPrograms(result.Items));
            // Channels row
            fetchItems(apiClient, { IncludeItemTypes: 'TvChannel' })
                .then(result => setChannels(result.Items));
        }
    }, [collectionType, parentId, query, serverId]);

    return (
        <div
            className={classNames(
                'searchResults',
                'padded-bottom-page',
                'padded-top',
                { 'hide': !query || !(collectionType === 'livetv') }
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
