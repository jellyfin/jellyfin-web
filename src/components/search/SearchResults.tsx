import type { BaseItemDto, BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import type { ApiClient } from 'jellyfin-apiclient';
import classNames from 'classnames';
import React, { type FC, useCallback, useEffect, useState } from 'react';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { useDebounceValue } from 'usehooks-ts';

import globalize from '../../scripts/globalize';
import ServerConnections from '../ServerConnections';
import SearchResultsRow from './SearchResultsRow';
import Loading from '../loading/LoadingComponent';

type SearchResultsProps = {
    serverId?: string;
    parentId?: string | null;
    collectionType?: string | null;
    query?: string;
};

const ensureNonNullItems = (result: BaseItemDtoQueryResult) => ({
    ...result,
    Items: result.Items || []
});

const isMovies = (collectionType: string) => collectionType === CollectionType.Movies;

const isMusic = (collectionType: string) => collectionType === CollectionType.Music;

const isTVShows = (collectionType: string) => collectionType === CollectionType.Tvshows;

/*
 * React component to display search result rows for global search and non-live tv library search
 */
const SearchResults: FC<SearchResultsProps> = ({ serverId = window.ApiClient.serverId(), parentId, collectionType, query }: SearchResultsProps) => {
    const [ movies, setMovies ] = useState<BaseItemDto[]>([]);
    const [ shows, setShows ] = useState<BaseItemDto[]>([]);
    const [ episodes, setEpisodes ] = useState<BaseItemDto[]>([]);
    const [ videos, setVideos ] = useState<BaseItemDto[]>([]);
    const [ programs, setPrograms ] = useState<BaseItemDto[]>([]);
    const [ channels, setChannels ] = useState<BaseItemDto[]>([]);
    const [ playlists, setPlaylists ] = useState<BaseItemDto[]>([]);
    const [ artists, setArtists ] = useState<BaseItemDto[]>([]);
    const [ albums, setAlbums ] = useState<BaseItemDto[]>([]);
    const [ songs, setSongs ] = useState<BaseItemDto[]>([]);
    const [ photoAlbums, setPhotoAlbums ] = useState<BaseItemDto[]>([]);
    const [ photos, setPhotos ] = useState<BaseItemDto[]>([]);
    const [ audioBooks, setAudioBooks ] = useState<BaseItemDto[]>([]);
    const [ books, setBooks ] = useState<BaseItemDto[]>([]);
    const [ people, setPeople ] = useState<BaseItemDto[]>([]);
    const [ collections, setCollections ] = useState<BaseItemDto[]>([]);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ debouncedQuery ] = useDebounceValue(query, 500);

    const getDefaultParameters = useCallback(() => ({
        ParentId: parentId,
        searchTerm: debouncedQuery,
        Limit: 100,
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

    const fetchArtists = useCallback((apiClient: ApiClient, params = {}) => (
        apiClient?.getArtists(
            apiClient.getCurrentUserId(),
            {
                ...getDefaultParameters(),
                IncludeArtists: true,
                ...params
            }
        ).then(ensureNonNullItems)
    ), [getDefaultParameters]);

    const fetchItems = useCallback((apiClient: ApiClient, params = {}) => (
        apiClient?.getItems(
            apiClient.getCurrentUserId(),
            {
                ...getDefaultParameters(),
                IncludeMedia: true,
                ...params
            }
        ).then(ensureNonNullItems)
    ), [getDefaultParameters]);

    const fetchPeople = useCallback((apiClient: ApiClient, params = {}) => (
        apiClient?.getPeople(
            apiClient.getCurrentUserId(),
            {
                ...getDefaultParameters(),
                IncludePeople: true,
                ...params
            }
        ).then(ensureNonNullItems)
    ), [getDefaultParameters]);

    useEffect(() => {
        if (query) setIsLoading(true);
    }, [ query ]);

    useEffect(() => {
        // Reset state
        setMovies([]);
        setShows([]);
        setEpisodes([]);
        setVideos([]);
        setPrograms([]);
        setChannels([]);
        setPlaylists([]);
        setArtists([]);
        setAlbums([]);
        setSongs([]);
        setPhotoAlbums([]);
        setPhotos([]);
        setAudioBooks([]);
        setBooks([]);
        setPeople([]);
        setCollections([]);

        if (!debouncedQuery) {
            setIsLoading(false);
            return;
        }

        const apiClient = ServerConnections.getApiClient(serverId);
        const fetchPromises = [];

        // Movie libraries
        if (!collectionType || isMovies(collectionType)) {
            fetchPromises.push(
                // Movies row
                fetchItems(apiClient, { IncludeItemTypes: 'Movie' })
                    .then(result => setMovies(result.Items))
                    .catch(() => setMovies([]))
            );
        }

        // TV Show libraries
        if (!collectionType || isTVShows(collectionType)) {
            fetchPromises.push(
                // Shows row
                fetchItems(apiClient, { IncludeItemTypes: 'Series' })
                    .then(result => setShows(result.Items))
                    .catch(() => setShows([])),
                // Episodes row
                fetchItems(apiClient, { IncludeItemTypes: 'Episode' })
                    .then(result => setEpisodes(result.Items))
                    .catch(() => setEpisodes([]))
            );
        }

        // People are included for Movies and TV Shows
        if (!collectionType || isMovies(collectionType) || isTVShows(collectionType)) {
            fetchPromises.push(
                // People row
                fetchPeople(apiClient)
                    .then(result => setPeople(result.Items))
                    .catch(() => setPeople([]))
            );
        }

        // Music libraries
        if (!collectionType || isMusic(collectionType)) {
            fetchPromises.push(
                // Playlists row
                fetchItems(apiClient, { IncludeItemTypes: 'Playlist' })
                    .then(results => setPlaylists(results.Items))
                    .catch(() => setPlaylists([])),
                // Artists row
                fetchArtists(apiClient)
                    .then(result => setArtists(result.Items))
                    .catch(() => setArtists([])),
                // Albums row
                fetchItems(apiClient, { IncludeItemTypes: 'MusicAlbum' })
                    .then(result => setAlbums(result.Items))
                    .catch(() => setAlbums([])),
                // Songs row
                fetchItems(apiClient, { IncludeItemTypes: 'Audio' })
                    .then(result => setSongs(result.Items))
                    .catch(() => setSongs([]))
            );
        }

        // Other libraries do not support in-library search currently
        if (!collectionType) {
            fetchPromises.push(
                // Videos row
                fetchItems(apiClient, {
                    MediaTypes: 'Video',
                    ExcludeItemTypes: 'Movie,Episode,TvChannel'
                })
                    .then(result => setVideos(result.Items))
                    .catch(() => setVideos([])),
                // Programs row
                fetchItems(apiClient, { IncludeItemTypes: 'LiveTvProgram' })
                    .then(result => setPrograms(result.Items))
                    .catch(() => setPrograms([])),
                // Channels row
                fetchItems(apiClient, { IncludeItemTypes: 'TvChannel' })
                    .then(result => setChannels(result.Items))
                    .catch(() => setChannels([])),
                // Photo Albums row
                fetchItems(apiClient, { IncludeItemTypes: 'PhotoAlbum' })
                    .then(result => setPhotoAlbums(result.Items))
                    .catch(() => setPhotoAlbums([])),
                // Photos row
                fetchItems(apiClient, { IncludeItemTypes: 'Photo' })
                    .then(result => setPhotos(result.Items))
                    .catch(() => setPhotos([])),
                // Audio Books row
                fetchItems(apiClient, { IncludeItemTypes: 'AudioBook' })
                    .then(result => setAudioBooks(result.Items))
                    .catch(() => setAudioBooks([])),
                // Books row
                fetchItems(apiClient, { IncludeItemTypes: 'Book' })
                    .then(result => setBooks(result.Items))
                    .catch(() => setBooks([])),
                // Collections row
                fetchItems(apiClient, { IncludeItemTypes: 'BoxSet' })
                    .then(result => setCollections(result.Items))
                    .catch(() => setCollections([]))
            );
        }
        Promise.all(fetchPromises)
            .then(() => {
                setIsLoading(false); // Set loading to false when all fetch calls are done
            })
            .catch((error) => {
                console.error('An error occurred while fetching data:', error);
                setIsLoading(false); // Set loading to false even if an error occurs
            });
    }, [collectionType, fetchArtists, fetchItems, fetchPeople, debouncedQuery, serverId]);

    const allEmpty = [movies, shows, episodes, videos, programs, channels, playlists, artists, albums, songs, photoAlbums, photos, audioBooks, books, people, collections].every(arr => arr.length === 0);

    return (
        <div
            className={classNames(
                'searchResults',
                'padded-bottom-page',
                'padded-top',
                { 'hide': !debouncedQuery || collectionType === CollectionType.Livetv }
            )}
        >
            {isLoading ? (
                <Loading />
            ) : (
                <>
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
                        title={globalize.translate('HeaderVideos')}
                        items={videos}
                        cardOptions={{ showParentTitle: true }}
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
                        title={globalize.translate('Channels')}
                        items={channels}
                        cardOptions={{ shape: 'square' }}
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
                        title={globalize.translate('Collections')}
                        items={collections}
                    />
                    <SearchResultsRow
                        title={globalize.translate('People')}
                        items={people}
                        cardOptions={{ coverImage: true }}
                    />

                    {allEmpty && debouncedQuery && !isLoading && (
                        <div className='noItemsMessage centerMessage'>
                            {globalize.translate('SearchResultsEmpty', debouncedQuery)}
                        </div>
                    )}
                </>
            )}

        </div>
    );
};

export default SearchResults;
