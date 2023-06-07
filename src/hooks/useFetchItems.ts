import type { ItemsApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client';
import { AxiosRequestConfig } from 'axios';

import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { getGenresApi } from '@jellyfin/sdk/lib/utils/api/genres-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getMoviesApi } from '@jellyfin/sdk/lib/utils/api/movies-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { useQuery } from '@tanstack/react-query';

import { JellyfinApiContext, useApi } from './useApi';
import { Sections, SectionsViewType } from 'types/suggestionsSections';

type ParentId = string | null | undefined;

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
            fetchGetItems(currentApi, parametersOptions, { signal })
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
    parentId: ParentId,
    itemType: BaseItemKind,
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

export const useGetGenres = (parentId: ParentId, itemType: BaseItemKind) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['Genres', parentId],
        queryFn: ({ signal }) =>
            fetchGetGenres(currentApi, parentId, itemType, { signal }),
        enabled: !!parentId
    });
};
