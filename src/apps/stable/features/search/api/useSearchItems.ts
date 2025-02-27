import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk';
import type {
    ArtistsApiGetArtistsRequest,
    BaseItemDto,
    ItemsApiGetItemsRequest,
    PersonsApiGetPersonsRequest
} from '@jellyfin/sdk/lib/generated-client';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getPersonsApi } from '@jellyfin/sdk/lib/utils/api/persons-api';
import { getArtistsApi } from '@jellyfin/sdk/lib/utils/api/artists-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../../../hooks/useApi';
import type { CardOptions } from 'types/cardOptions';
import { CardShape } from 'utils/card';

const QUERY_OPTIONS = {
    limit: 100,
    fields: [
        ItemFields.PrimaryImageAspectRatio,
        ItemFields.CanDelete,
        ItemFields.MediaSourceCount
    ],
    enableTotalRecordCount: false,
    imageTypeLimit: 1
};

const fetchItemsByType = async (
    api: Api,
    userId?: string,
    params?: ItemsApiGetItemsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getItemsApi(api).getItems(
        {
            ...QUERY_OPTIONS,
            userId: userId,
            recursive: true,
            ...params
        },
        options
    );
    return response.data;
};

const fetchPeople = async (
    api: Api,
    userId: string,
    params?: PersonsApiGetPersonsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getPersonsApi(api).getPersons(
        {
            ...QUERY_OPTIONS,
            userId: userId,
            ...params
        },
        options
    );
    return response.data;
};

const fetchArtists = async (
    api: Api,
    userId: string,
    params?: ArtistsApiGetArtistsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getArtistsApi(api).getArtists(
        {
            ...QUERY_OPTIONS,
            userId: userId,
            ...params
        },
        options
    );
    return response.data;
};

const isMovies = (collectionType: string) =>
    collectionType === CollectionType.Movies;

const isMusic = (collectionType: string) =>
    collectionType === CollectionType.Music;

const isTVShows = (collectionType: string) =>
    collectionType === CollectionType.Tvshows;

const isLivetv = (collectionType: string) =>
    collectionType === CollectionType.Livetv;

const LIVETV_CARD_OPTIONS = {
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

export interface Section {
    title: string
    items: BaseItemDto[];
    cardOptions?: CardOptions;
}

export const useSearchItems = (
    parentId?: string,
    collectionType?: string,
    searchTerm?: string
) => {
    const { api, user } = useApi();
    const userId = user?.Id;

    return useQuery({
        queryKey: ['SearchItems', { parentId, collectionType, searchTerm }],
        queryFn: async ({ signal }) => {
            if (!api) throw new Error('No API instance available');
            if (!userId) throw new Error('No User ID provided');

            const sections: Section[] = [];

            const addSection = (
                title: string,
                items: BaseItemDto[] | null | undefined,
                cardOptions?: CardOptions
            ) => {
                if (items && items?.length > 0) {
                    sections.push({ title, items, cardOptions });
                }
            };

            // Livetv libraries
            if (collectionType && isLivetv(collectionType)) {
                // Movies row
                const moviesData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.LiveTvProgram],
                        isMovie: true,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Movies', moviesData.Items, {
                    ...LIVETV_CARD_OPTIONS,
                    shape: CardShape.PortraitOverflow
                });

                // Episodes row
                const episodesData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.LiveTvProgram],
                        isMovie: false,
                        isSeries: true,
                        isSports: false,
                        isKids: false,
                        isNews: false,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Episodes', episodesData.Items, {
                    ...LIVETV_CARD_OPTIONS
                });

                // Sports row
                const sportsData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.LiveTvProgram],
                        isSports: true,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Sports', sportsData.Items, {
                    ...LIVETV_CARD_OPTIONS
                });

                // Kids row
                const kidsData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.LiveTvProgram],
                        isKids: true,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Kids', kidsData.Items, {
                    ...LIVETV_CARD_OPTIONS
                });

                // News row
                const newsData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.LiveTvProgram],
                        isNews: true,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('News', newsData.Items, {
                    ...LIVETV_CARD_OPTIONS
                });

                // Programs row
                const programsData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.LiveTvProgram],
                        isMovie: false,
                        isSeries: false,
                        isSports: false,
                        isKids: false,
                        isNews: false,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Programs', programsData.Items, {
                    ...LIVETV_CARD_OPTIONS
                });

                // Channels row
                const channelsData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.TvChannel],
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Channels', channelsData.Items);
            }

            // Movie libraries
            if (!collectionType || isMovies(collectionType)) {
                // Movies row
                const moviesData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.Movie],
                        parentId: parentId,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Movies', moviesData.Items, {
                    showYear: true
                });
            }

            // TV Show libraries
            if (!collectionType || isTVShows(collectionType)) {
                // Shows row
                const showsData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.Series],
                        parentId: parentId,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Shows', showsData.Items, {
                    showYear: true
                });

                // Episodes row
                const episodesData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.Episode],
                        parentId: parentId,
                        isMissing: user?.Configuration?.DisplayMissingEpisodes,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Episodes', episodesData.Items, {
                    coverImage: true,
                    showParentTitle: true
                });
            }

            // People are included for Movies and TV Shows
            if (
                !collectionType
                || isMovies(collectionType)
                || isTVShows(collectionType)
            ) {
                // People row
                const peopleData = await fetchPeople(
                    api,
                    userId,
                    {
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('People', peopleData.Items, {
                    coverImage: true
                });
            }

            // Music libraries
            if (!collectionType || isMusic(collectionType)) {
                // Playlists row
                const playlistsData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.Playlist],
                        parentId: parentId,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Playlists', playlistsData.Items);

                // Artists row
                const artistsData = await fetchArtists(
                    api,
                    userId,
                    {
                        parentId: parentId,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Artists', artistsData.Items, {
                    coverImage: true
                });

                // Albums row
                const albumsData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.MusicAlbum],
                        parentId: parentId,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Albums', albumsData.Items, {
                    showYear: true
                });

                // Songs row
                const songsData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.Audio],
                        parentId: parentId,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Songs', songsData.Items, {
                    showParentTitle: true,
                    shape: CardShape.SquareOverflow
                });
            }

            // Other libraries do not support in-library search currently
            if (!collectionType) {
                // Videos row
                const videosData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        mediaTypes: [MediaType.Video],
                        excludeItemTypes: [
                            BaseItemKind.Movie,
                            BaseItemKind.Episode,
                            BaseItemKind.TvChannel
                        ],
                        parentId: parentId,
                        searchTerm: searchTerm
                    },
                    { signal }
                );

                addSection('HeaderVideos', videosData.Items, {
                    showParentTitle: true
                });

                // Programs row
                const programsData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.LiveTvProgram],
                        parentId: parentId,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Programs', programsData.Items, {
                    ...LIVETV_CARD_OPTIONS
                });

                // Channels row
                const channelsData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.TvChannel],
                        parentId: parentId,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Channels', channelsData.Items);

                // Photo Albums row
                const photoAlbumsData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.PhotoAlbum],
                        parentId: parentId,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('HeaderPhotoAlbums', photoAlbumsData.Items);

                // Photos row
                const photosData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.Photo],
                        parentId: parentId,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Photos', photosData.Items);

                // Audio Books row
                const audioBooksData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.AudioBook],
                        parentId: parentId,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('HeaderAudioBooks', audioBooksData.Items);

                // Books row
                const booksData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.Book],
                        parentId: parentId,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Books', booksData.Items);

                // Collections row
                const collectionsData = await fetchItemsByType(
                    api,
                    userId,
                    {
                        includeItemTypes: [BaseItemKind.BoxSet],
                        parentId: parentId,
                        searchTerm: searchTerm
                    },
                    { signal }
                );
                addSection('Collections', collectionsData.Items);
            }

            return sections;
        },
        enabled: !!api && !!userId
    });
};
