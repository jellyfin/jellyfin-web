import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

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

/*
 * React component to display search result rows for live tv library search
 */
const LiveTVSearchResults = ({ serverId, parentId, collectionType, query }) => {
    const [ movies, setMovies ] = useState([]);
    const [ episodes, setEpisodes ] = useState([]);
    const [ sports, setSports ] = useState([]);
    const [ kids, setKids ] = useState([]);
    const [ news, setNews ] = useState([]);
    const [ programs, setPrograms ] = useState([]);
    const [ videos, setVideos ] = useState([]);

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

    const isLiveTV = () => collectionType === 'livetv';

    useEffect(() => {
        // Reset state
        setMovies([]);
        setEpisodes([]);
        setSports([]);
        setKids([]);
        setNews([]);
        setPrograms([]);
        setVideos([]);

        if (query && isLiveTV()) {
            const apiClient = ServerConnections.getApiClient(serverId);

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
            // NOTE: I believe this is supposed to be home videos, but it
            // includes TV channels so it should probably be included for Live TV
            // Videos row
            fetchItems(apiClient, {
                MediaTypes: 'Video',
                ExcludeItemTypes: 'Movie,Episode'
            }).then(result => setVideos(result.Items));
        }
    }, [ query ]);

    return (
        <div
            className={classNames(
                'searchResults',
                'padded-bottom-page',
                'padded-top',
                { 'hide': !query || !isLiveTV() }
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
                title={globalize.translate('Videos')}
                items={videos}
                cardOptions={{ showParentTitle: true }}
            />
        </div>
    );
};

LiveTVSearchResults.propTypes = {
    serverId: PropTypes.string,
    parentId: PropTypes.string,
    collectionType: PropTypes.string,
    query: PropTypes.string
};

export default LiveTVSearchResults;
