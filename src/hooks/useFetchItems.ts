import type { ItemsApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { getArtistsApi } from '@jellyfin/sdk/lib/utils/api/artists-api';
import { getFilterApi } from '@jellyfin/sdk/lib/utils/api/filter-api';
import { getGenresApi } from '@jellyfin/sdk/lib/utils/api/genres-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getMoviesApi } from '@jellyfin/sdk/lib/utils/api/movies-api';
import { getStudiosApi } from '@jellyfin/sdk/lib/utils/api/studios-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { AxiosRequestConfig } from 'axios';
import { useQuery } from '@tanstack/react-query';

import { JellyfinApiContext, useApi } from './useApi';
import { getAlphaPickerQuery, getFieldsQuery, getFiltersQuery, getLimitQuery } from 'utils/items';
import { Sections, SectionsViewType } from 'types/suggestionsSections';
import { LibraryViewSettings, ParentId } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

const fetchGetItem = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id && parentId) {
        const response = await getUserLibraryApi(api).getItem(
            {
                userId: user.Id,
                itemId: parentId
            },
            {
                signal: options?.signal
            }
        );
        return response.data;
    }
};

export const useGetItem = (parentId: ParentId) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['Item', parentId],
        queryFn: ({ signal }) => fetchGetItem(currentApi, parentId, { signal }),
        enabled: !!parentId
    });
};

const fetchGetItems = async (
    currentApi: JellyfinApiContext,
    parametersOptions: ItemsApiGetItemsRequest,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getItemsApi(api).getItems(
            {
                userId: user.Id,
                ...parametersOptions
            },
            {
                signal: options?.signal
            }
        );
        return response.data;
    }
};

export const useGetItems = (parametersOptions: ItemsApiGetItemsRequest) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: [
            'Items',
            {
                ...parametersOptions
            }
        ],
        queryFn: ({ signal }) =>
            fetchGetItems(currentApi, parametersOptions, { signal }),
        cacheTime: parametersOptions.sortBy?.includes(ItemSortBy.Random) ? 0 : undefined
    });
};

const fetchGetMovieRecommendations = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getMoviesApi(api).getMovieRecommendations(
            {
                userId: user.Id,
                fields: [
                    ItemFields.PrimaryImageAspectRatio,
                    ItemFields.MediaSourceCount,
                    ItemFields.BasicSyncInfo
                ],
                parentId: parentId ?? undefined,
                categoryLimit: 6,
                itemLimit: 20
            },
            {
                signal: options?.signal
            }
        );
        return response.data;
    }
};

export const useGetMovieRecommendations = (parentId: ParentId) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['MovieRecommendations', parentId],
        queryFn: ({ signal }) =>
            fetchGetMovieRecommendations(currentApi, parentId, { signal }),
        enabled: !!parentId
    });
};

const fetchGetItemsBySuggestionsType = async (
    currentApi: JellyfinApiContext,
    sections: Sections,
    parentId: ParentId,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        let response;
        switch (sections.viewType) {
            case SectionsViewType.NextUp: {
                response = (
                    await getTvShowsApi(api).getNextUp(
                        {
                            userId: user.Id,
                            limit: 25,
                            fields: [
                                ItemFields.PrimaryImageAspectRatio,
                                ItemFields.MediaSourceCount,
                                ItemFields.BasicSyncInfo
                            ],
                            parentId: parentId ?? undefined,
                            imageTypeLimit: 1,
                            enableImageTypes: [
                                ImageType.Primary,
                                ImageType.Backdrop,
                                ImageType.Thumb
                            ],
                            enableTotalRecordCount: false,
                            ...sections.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            case SectionsViewType.ResumeItems: {
                response = (
                    await getItemsApi(api).getResumeItems(
                        {
                            userId: user?.Id,
                            parentId: parentId ?? undefined,
                            fields: [
                                ItemFields.PrimaryImageAspectRatio,
                                ItemFields.MediaSourceCount,
                                ItemFields.BasicSyncInfo
                            ],
                            imageTypeLimit: 1,
                            enableImageTypes: [ImageType.Thumb],
                            enableTotalRecordCount: false,
                            ...sections.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            case SectionsViewType.LatestMedia: {
                response = (
                    await getUserLibraryApi(api).getLatestMedia(
                        {
                            userId: user.Id,
                            fields: [
                                ItemFields.PrimaryImageAspectRatio,
                                ItemFields.MediaSourceCount,
                                ItemFields.BasicSyncInfo
                            ],
                            parentId: parentId ?? undefined,
                            imageTypeLimit: 1,
                            enableImageTypes: [ImageType.Primary],
                            ...sections.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data;
                break;
            }
            default: {
                response = (
                    await getItemsApi(api).getItems(
                        {
                            userId: user.Id,
                            parentId: parentId ?? undefined,
                            recursive: true,
                            fields: [ItemFields.PrimaryImageAspectRatio],
                            filters: [ItemFilter.IsPlayed],
                            imageTypeLimit: 1,
                            enableImageTypes: [
                                ImageType.Primary,
                                ImageType.Backdrop,
                                ImageType.Thumb
                            ],
                            limit: 25,
                            enableTotalRecordCount: false,
                            ...sections.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
        }
        return response;
    }
};

export const useGetItemsBySectionType = (
    sections: Sections,
    parentId: ParentId
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['ItemsBySuggestionsType', sections.view],
        queryFn: ({ signal }) =>
            fetchGetItemsBySuggestionsType(
                currentApi,
                sections,
                parentId,
                { signal }
            ),
        enabled: !!sections.view
    });
};

const fetchGetGenres = async (
    currentApi: JellyfinApiContext,
    itemType: BaseItemKind,
    parentId: ParentId,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getGenresApi(api).getGenres(
            {
                userId: user.Id,
                sortBy: [ItemSortBy.SortName],
                sortOrder: [SortOrder.Ascending],
                includeItemTypes: [itemType],
                enableTotalRecordCount: false,
                parentId: parentId ?? undefined
            },
            {
                signal: options?.signal
            }
        );
        return response.data;
    }
};

export const useGetGenres = (itemType: BaseItemKind, parentId: ParentId) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['Genres', parentId],
        queryFn: ({ signal }) =>
            fetchGetGenres(currentApi, itemType, parentId, { signal }),
        enabled: !!parentId
    });
};

const fetchGetStudios = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    itemType: BaseItemKind[],
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getStudiosApi(api).getStudios(
            {
                userId: user.Id,
                includeItemTypes: itemType,
                fields: [
                    ItemFields.DateCreated,
                    ItemFields.PrimaryImageAspectRatio
                ],
                enableImageTypes: [ImageType.Thumb],
                parentId: parentId ?? undefined,
                enableTotalRecordCount: false
            },
            {
                signal: options?.signal
            }
        );
        return response.data;
    }
};

export const useGetStudios = (parentId: ParentId, itemType: BaseItemKind[]) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['Studios', parentId, itemType],
        queryFn: ({ signal }) =>
            fetchGetStudios(currentApi, parentId, itemType, { signal }),
        enabled: !!parentId
    });
};

const fetchGetQueryFiltersLegacy = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    itemType: BaseItemKind[],
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getFilterApi(api).getQueryFiltersLegacy(
            {
                userId: user.Id,
                parentId: parentId ?? undefined,
                includeItemTypes: itemType
            },
            {
                signal: options?.signal
            }
        );
        return response.data;
    }
};

export const useGetQueryFiltersLegacy = (
    parentId: ParentId,
    itemType: BaseItemKind[]
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['QueryFiltersLegacy', parentId, itemType],
        queryFn: ({ signal }) =>
            fetchGetQueryFiltersLegacy(currentApi, parentId, itemType, {
                signal
            }),
        enabled: !!parentId
    });
};

const fetchGetItemsViewByType = async (
    currentApi: JellyfinApiContext,
    viewType: LibraryTab,
    parentId: ParentId,
    itemType: BaseItemKind[],
    libraryViewSettings: LibraryViewSettings,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        let response;
        switch (viewType) {
            case LibraryTab.AlbumArtists: {
                response = await getArtistsApi(api).getAlbumArtists(
                    {
                        userId: user.Id,
                        parentId: parentId ?? undefined,
                        enableImageTypes: [libraryViewSettings.ImageType, ImageType.Backdrop],
                        ...getFieldsQuery(viewType, libraryViewSettings),
                        ...getFiltersQuery(viewType, libraryViewSettings),
                        ...getLimitQuery(),
                        ...getAlphaPickerQuery(libraryViewSettings),
                        sortBy: [libraryViewSettings.SortBy],
                        sortOrder: [libraryViewSettings.SortOrder],
                        includeItemTypes: itemType,
                        startIndex: libraryViewSettings.StartIndex
                    },
                    {
                        signal: options?.signal
                    }
                );
                break;
            }
            case LibraryTab.Artists: {
                response = await getArtistsApi(api).getArtists(
                    {
                        userId: user.Id,
                        parentId: parentId ?? undefined,
                        enableImageTypes: [libraryViewSettings.ImageType, ImageType.Backdrop],
                        ...getFieldsQuery(viewType, libraryViewSettings),
                        ...getFiltersQuery(viewType, libraryViewSettings),
                        ...getLimitQuery(),
                        ...getAlphaPickerQuery(libraryViewSettings),
                        sortBy: [libraryViewSettings.SortBy],
                        sortOrder: [libraryViewSettings.SortOrder],
                        includeItemTypes: itemType,
                        startIndex: libraryViewSettings.StartIndex
                    },
                    {
                        signal: options?.signal
                    }
                );
                break;
            }
            case LibraryTab.Networks:
                response = await getStudiosApi(api).getStudios(
                    {
                        userId: user.Id,
                        parentId: parentId ?? undefined,
                        ...getFieldsQuery(viewType, libraryViewSettings),
                        includeItemTypes: itemType,
                        enableImageTypes: [ImageType.Thumb],
                        startIndex: libraryViewSettings.StartIndex
                    },
                    {
                        signal: options?.signal
                    }
                );
                break;
            default: {
                response = await getItemsApi(api).getItems(
                    {
                        userId: user.Id,
                        recursive: true,
                        imageTypeLimit: 1,
                        parentId: parentId ?? undefined,
                        enableImageTypes: [libraryViewSettings.ImageType, ImageType.Backdrop],
                        ...getFieldsQuery(viewType, libraryViewSettings),
                        ...getFiltersQuery(viewType, libraryViewSettings),
                        ...getLimitQuery(),
                        ...getAlphaPickerQuery(libraryViewSettings),
                        isFavorite: viewType === LibraryTab.Favorites ? true : undefined,
                        sortBy: [libraryViewSettings.SortBy],
                        sortOrder: [libraryViewSettings.SortOrder],
                        includeItemTypes: itemType,
                        startIndex: libraryViewSettings.StartIndex
                    },
                    {
                        signal: options?.signal
                    }
                );
                break;
            }
        }
        return response.data;
    }
};

export const useGetItemsViewByType = (
    viewType: LibraryTab,
    parentId: ParentId,
    itemType: BaseItemKind[],
    libraryViewSettings: LibraryViewSettings
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: [
            'ItemsViewByType',
            viewType,
            parentId,
            itemType,
            libraryViewSettings
        ],
        queryFn: ({ signal }) =>
            fetchGetItemsViewByType(
                currentApi,
                viewType,
                parentId,
                itemType,
                libraryViewSettings,
                { signal }
            ),
        refetchOnWindowFocus: false,
        keepPreviousData : true,
        enabled:
            [
                LibraryTab.Movies,
                LibraryTab.Favorites,
                LibraryTab.Collections,
                LibraryTab.Trailers,
                LibraryTab.Series,
                LibraryTab.Episodes,
                LibraryTab.Networks,
                LibraryTab.Albums,
                LibraryTab.AlbumArtists,
                LibraryTab.Artists,
                LibraryTab.Playlists,
                LibraryTab.Songs,
                LibraryTab.Books,
                LibraryTab.Photos,
                LibraryTab.Videos
            ].includes(viewType) && !!parentId
    });
};
