import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import globalize from '../../scripts/globalize';
import ServerConnections from '../ServerConnections';
import SearchResultsRow from './SearchResultsRow';

const SearchResultsComponent = ({ serverId, parentId, collectionType, query }) => {
    const [ apiClient, setApiClient ] = useState();
    const [ movies, setMovies ] = useState([]);
    const [ shows, setShows ] = useState([]);
    const [ episodes, setEpisodes ] = useState([]);
    const [ programs, setPrograms ] = useState([]);
    const [ videos, setVideos ] = useState([]);
    const [ playlists, setPlaylists ] = useState([]);
    const [ artists, setArtists ] = useState([]);
    const [ albums, setAlbums ] = useState([]);
    const [ songs, setSongs ] = useState([]);
    const [ photoAlbums, setPhotoAlbums ] = useState([]);
    const [ photos, setPhotos ] = useState([]);
    const [ audioBooks, setAudioBooks ] = useState([]);
    const [ books, setBooks ] = useState([]);
    const [ people, setPeople ] = useState([]);

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

    const fetchArtists = (apiClient, params = {}) => apiClient?.getArtists(
        apiClient?.getCurrentUserId(),
        {
            ...getDefaultParameters(),
            IncludeArtists: true,
            ...params
        }
    );

    const fetchItems = (apiClient, params = {}) => apiClient?.getItems(
        apiClient?.getCurrentUserId(),
        {
            ...getDefaultParameters(),
            IncludeMedia: true,
            ...params
        }
    );

    const fetchPeople = (apiClient, params = {}) => apiClient?.getPeople(
        apiClient?.getCurrentUserId(),
        {
            ...getDefaultParameters(),
            IncludePeople: true,
            ...params
        }
    );

    const isMovies = () => collectionType === 'movies';

    const isMusic = () => collectionType === 'music';

    const isTVShows = () => collectionType === 'tvshows' || collectionType === 'tv';

    useEffect(() => {
        if (serverId) setApiClient(ServerConnections.getApiClient(serverId));
    }, [ serverId ]);

    useEffect(() => {
        // Reset state
        setMovies([]);
        setShows([]);
        setEpisodes([]);
        setPrograms([]);
        setVideos([]);
        setPlaylists([]);
        setArtists([]);
        setAlbums([]);
        setSongs([]);
        setPhotoAlbums([]);
        setPhotos([]);
        setAudioBooks([]);
        setBooks([]);
        setPeople([]);

        if (query) {
            // Movie libraries
            if (!collectionType || isMovies()) {
                // Movies row
                fetchItems(apiClient, { IncludeItemTypes: 'Movie' })
                    .then(result => setMovies(result.Items));
            }

            // TV Show libraries
            if (!collectionType || isTVShows()) {
                // Shows row
                fetchItems(apiClient, { IncludeItemTypes: 'Series' })
                    .then(result => setShows(result.Items));
                // Episodes row
                fetchItems(apiClient, { IncludeItemTypes: 'Episode' })
                    .then(result => setEpisodes(result.Items));
            }

            // People are included for Movies and TV Shows
            if (!collectionType || isMovies() || isTVShows()) {
                // People row
                fetchPeople(apiClient).then(result => setPeople(result.Items));
            }

            // Music libraries
            if (!collectionType || isMusic()) {
                // Playlists row
                fetchItems(apiClient, { IncludeItemTypes: 'Playlist' })
                    .then(results => setPlaylists(results.Items));
                // Artists row
                fetchArtists(apiClient).then(result => setArtists(result.Items));
                // Albums row
                fetchItems(apiClient, { IncludeItemTypes: 'MusicAlbum' })
                    .then(result => setAlbums(result.Items));
                // Songs row
                fetchItems(apiClient, { IncludeItemTypes: 'Audio' })
                    .then(result => setSongs(result.Items));
            }

            // Other libraries do not support in-library search currently
            if (!collectionType) {
                // Programs row
                fetchItems(apiClient, { IncludeItemTypes: 'LiveTvProgram' })
                    .then(result => setPrograms(result.Items));
                // Videos row
                fetchItems(apiClient, {
                    MediaTypes: 'Video',
                    ExcludeItemTypes: 'Movie,Episode'
                }).then(result => setVideos(result.Items));
                // Photo Albums row
                fetchItems(apiClient, { IncludeItemTypes: 'PhotoAlbum' })
                    .then(results => setPhotoAlbums(results.Items));
                // Photos row
                fetchItems(apiClient, { IncludeItemTypes: 'Photo' })
                    .then(results => setPhotos(results.Items));
                // Audio Books row
                fetchItems(apiClient, { IncludeItemTypes: 'AudioBook' })
                    .then(results => setAudioBooks(results.Items));
                // Books row
                fetchItems(apiClient, { IncludeItemTypes: 'Book' })
                    .then(results => setBooks(results.Items));
            }
        }
    }, [ query ]);

    return (
        <div
            className={classNames(
                'searchResults',
                'padded-bottom-page',
                'padded-top',
                { 'hide': !query || collectionType === 'livetv' }
            )}
        >
            <SearchResultsRow
                title={globalize.translate('Movies')}
                items={movies}
                cardOptions={{ showYear: true }}
            />
            <SearchResultsRow
                title={globalize.translate('Shows')}
                items={shows}
                cardOptions={{ showYear: true }}
            />
            <SearchResultsRow
                title={globalize.translate('Episodes')}
                items={episodes}
                cardOptions={{
                    coverImage: true,
                    showParentTitle: true
                }}
            />
            <SearchResultsRow
                title={globalize.translate('Programs')}
                items={programs}
                cardOptions={{
                    preferThumb: true,
                    inheritThumb: false,
                    showParentTitleOrTitle: true,
                    showTitle: false,
                    coverImage: true,
                    overlayMoreButton: true,
                    showAirTime: true,
                    showAirDateTime: true,
                    showChannelName: true
                }}
            />
            <SearchResultsRow
                title={globalize.translate('Videos')}
                items={videos}
                cardOptions={{ showParentTitle: true }}
            />
            <SearchResultsRow
                title={globalize.translate('Playlists')}
                items={playlists}
            />
            <SearchResultsRow
                title={globalize.translate('Artists')}
                items={artists}
                cardOptions={{ coverImage: true }}
            />
            <SearchResultsRow
                title={globalize.translate('Albums')}
                items={albums}
                cardOptions={{ showParentTitle: true }}
            />
            <SearchResultsRow
                title={globalize.translate('Songs')}
                items={songs}
                cardOptions={{ showParentTitle: true }}
            />
            <SearchResultsRow
                title={globalize.translate('HeaderPhotoAlbums')}
                items={photoAlbums}
            />
            <SearchResultsRow
                title={globalize.translate('Photos')}
                items={photos}
            />
            <SearchResultsRow
                title={globalize.translate('HeaderAudioBooks')}
                items={audioBooks}
            />
            <SearchResultsRow
                title={globalize.translate('Books')}
                items={books}
            />
            <SearchResultsRow
                title={globalize.translate('People')}
                items={people}
                cardOptions={{ coverImage: true }}
            />
        </div>
    );
};

SearchResultsComponent.propTypes = {
    serverId: PropTypes.string,
    parentId: PropTypes.string,
    collectionType: PropTypes.string,
    query: PropTypes.string
};

export default SearchResultsComponent;
