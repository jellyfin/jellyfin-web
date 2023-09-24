import {
    LocationType,
    type BaseItemDto,
    type ItemsApiGetItemsRequest,
    type BaseItemKind
} from '@jellyfin/sdk/lib/generated-client';
import { AxiosRequestConfig } from 'axios';

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
import { getPersonsApi } from '@jellyfin/sdk/lib/utils/api/persons-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { useQuery } from '@tanstack/react-query';

import { type JellyfinApiContext, useApi } from './useApi';
import {
    getAlphaPickerQuery,
    getFieldsQuery,
    getFiltersQuery,
    getLimitQuery,
    getVisibleitemType
} from 'utils/items';
import { Sections, SectionsViewType } from 'types/suggestionsSections';
import { LibraryViewSettings, ParentId } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import { getItemTypesQuery } from '../utils/items';
import { useLibrarySettings } from './useLibrarySettings';
import { CollectionType } from 'types/collectionType';
import datetime from 'scripts/datetime';
import globalize from 'scripts/globalize';

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
        cacheTime: parametersOptions.sortBy?.includes(ItemSortBy.Random) ?
            0 :
            undefined
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
            fetchGetItemsBySuggestionsType(currentApi, sections, parentId, {
                signal
            }),
        enabled: !!sections.view
    });
};

type GroupsGenres = {
    genre: BaseItemDto;
    items: BaseItemDto[];
};

const fetchGetGroupsGenres = async (
    currentApi: JellyfinApiContext,
    item: BaseItemDto | undefined,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getGenresApi(api).getGenres(
            {
                userId: user.Id,
                sortBy: [ItemSortBy.SortName],
                sortOrder: [SortOrder.Ascending],
                includeItemTypes: getVisibleitemType(item?.CollectionType as CollectionType),
                enableTotalRecordCount: false,
                parentId: item?.Id ?? undefined
            },
            {
                signal: options?.signal
            }
        );

        const groupsGenres: GroupsGenres[] = [];
        const genres = response.data.Items ?? [];
        for (const genre of genres) {
            const responseItems = await getItemsApi(api).getItems(
                {
                    userId: user.Id,
                    sortBy: [ItemSortBy.Random],
                    sortOrder: [SortOrder.Ascending],
                    includeItemTypes: getVisibleitemType(item?.CollectionType as CollectionType),
                    recursive: true,
                    fields: [
                        ItemFields.PrimaryImageAspectRatio,
                        ItemFields.MediaSourceCount,
                        ItemFields.BasicSyncInfo
                    ],
                    imageTypeLimit: 1,
                    enableImageTypes: [ImageType.Primary],
                    limit: 25,
                    genreIds: genre.Id ? [genre.Id] : undefined,
                    enableTotalRecordCount: false,
                    parentId: item?.Id ?? undefined
                },
                {
                    signal: options?.signal
                }
            );
            const items = responseItems.data.Items ?? [];
            if (items?.length) {
                groupsGenres.push({
                    genre: genre,
                    items: items
                });
            }
        }

        return groupsGenres;
    }
};

export const useGetGroupsGenres = (item: BaseItemDto | undefined) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['GroupsGenres', item],
        queryFn: ({ signal }) =>
            fetchGetGroupsGenres(currentApi, item, {
                signal
            }),
        enabled: !!item?.Id,
        refetchOnWindowFocus: false,
        cacheTime: 0
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
            fetchGetStudios(currentApi, parentId, itemType, { signal: signal }),
        enabled: !!parentId
    });
};

const fetchGetItemsViewByType = async (
    currentApi: JellyfinApiContext,
    viewType: LibraryTab,
    item: BaseItemDto | undefined,
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
                        parentId: item?.Id ?? undefined,
                        includeItemTypes: getVisibleitemType(item?.CollectionType as CollectionType),
                        sortBy: [libraryViewSettings.SortBy],
                        sortOrder: [libraryViewSettings.SortOrder],
                        enableImageTypes: [
                            libraryViewSettings.ImageType,
                            ImageType.Backdrop
                        ],
                        ...getLimitQuery(),
                        ...getFieldsQuery(viewType, libraryViewSettings),
                        ...getFiltersQuery(viewType, libraryViewSettings),
                        ...getAlphaPickerQuery(libraryViewSettings),
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
                        parentId: item?.Id ?? undefined,
                        includeItemTypes: getVisibleitemType(item?.CollectionType as CollectionType),
                        enableImageTypes: [
                            libraryViewSettings.ImageType,
                            ImageType.Backdrop
                        ],
                        ...getLimitQuery(),
                        ...getFieldsQuery(viewType, libraryViewSettings),
                        ...getFiltersQuery(viewType, libraryViewSettings),
                        ...getAlphaPickerQuery(libraryViewSettings),
                        sortBy: [libraryViewSettings.SortBy],
                        sortOrder: [libraryViewSettings.SortOrder],
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
                        parentId: item?.Id ?? undefined,
                        includeItemTypes: getVisibleitemType(item?.CollectionType as CollectionType),
                        enableImageTypes: [ImageType.Thumb],
                        ...getLimitQuery(),
                        ...getFieldsQuery(viewType, libraryViewSettings),

                        startIndex: 0
                    },
                    {
                        signal: options?.signal
                    }
                );
                break;
            case LibraryTab.Genres: {
                response = await getGenresApi(api).getGenres(
                    {
                        userId: user.Id,
                        sortBy: [ItemSortBy.SortName],
                        sortOrder: [SortOrder.Ascending],
                        includeItemTypes: getVisibleitemType(item?.CollectionType as CollectionType),
                        enableTotalRecordCount: false,
                        enableImageTypes: [ImageType.Primary],
                        fields: [
                            ItemFields.PrimaryImageAspectRatio,
                            ItemFields.MediaSourceCount,
                            ItemFields.BasicSyncInfo,
                            ItemFields.ItemCounts
                        ],
                        parentId: item?.Id ?? undefined
                    },
                    {
                        signal: options?.signal
                    }
                );
                break;
            }
            case LibraryTab.Channels: {
                response = await getLiveTvApi(api).getLiveTvChannels(
                    {
                        userId: user.Id,
                        ...getFieldsQuery(viewType, libraryViewSettings),
                        startIndex: libraryViewSettings.StartIndex
                    },
                    {
                        signal: options?.signal
                    }
                );
                break;
            }
            default: {
                response = await getItemsApi(api).getItems(
                    {
                        userId: user.Id,
                        recursive: true,
                        imageTypeLimit: 1,
                        parentId: item?.Id ?? undefined,
                        enableImageTypes: [
                            libraryViewSettings.ImageType,
                            ImageType.Backdrop
                        ],
                        ...getFieldsQuery(viewType, libraryViewSettings),
                        ...getFiltersQuery(viewType, libraryViewSettings),
                        ...getLimitQuery(),
                        ...getAlphaPickerQuery(libraryViewSettings),
                        ...getItemTypesQuery(viewType),
                        isFavorite:
                            viewType === LibraryTab.Favorites ?
                                true :
                                undefined,
                        sortBy: [libraryViewSettings.SortBy],
                        sortOrder: [libraryViewSettings.SortOrder],
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
    item: BaseItemDto | undefined
) => {
    const currentApi = useApi();
    const { libraryViewSettings } = useLibrarySettings();

    return useQuery({
        queryKey: [
            'ViewItemsByType',
            viewType,
            item,
            {
                ...libraryViewSettings
            }
        ],
        queryFn: ({ signal }) =>
            fetchGetItemsViewByType(
                currentApi,
                viewType,
                item,
                libraryViewSettings,
                { signal: signal }
            ),
        refetchOnWindowFocus: false,
        keepPreviousData: true,
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
                LibraryTab.Videos,
                LibraryTab.Genres,
                LibraryTab.PhotoAlbums,
                LibraryTab.Channels
            ].includes(viewType) && !!item?.Id
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
                signal: signal
            }),
        enabled: !!parentId
    });
};

type GroupsUpcomingEpisodes = {
    name: string;
    items: BaseItemDto[];
};

function gropsUpcomingEpisodes(items: BaseItemDto[]) {
    const groups: GroupsUpcomingEpisodes[] = [];
    let currentGroupName = '';
    let currentGroup: BaseItemDto[] = [];
    for (const item of items) {
        let dateText = '';

        if (item.PremiereDate) {
            try {
                const premiereDate = datetime.parseISO8601Date(
                    item.PremiereDate,
                    true
                );
                dateText = datetime.isRelativeDay(premiereDate, -1) ?
                    globalize.translate('Yesterday') :
                    datetime.toLocaleDateString(premiereDate, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                    });
            } catch (err) {
                console.error('error parsing timestamp for upcoming tv shows');
            }
        }

        if (dateText != currentGroupName) {
            if (currentGroup.length) {
                groups.push({
                    name: currentGroupName,
                    items: currentGroup
                });
            }

            currentGroupName = dateText;
            currentGroup = [item];
        } else {
            currentGroup.push(item);
        }
    }
    return groups;
}

const fetchGetGroupsUpcomingEpisodes = async (
    currentApi: JellyfinApiContext,
    item: BaseItemDto | undefined,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getTvShowsApi(api).getUpcomingEpisodes(
            {
                userId: user.Id,
                limit: 25,
                fields: [ItemFields.AirTime],
                parentId: item?.Id ?? undefined,
                imageTypeLimit: 1,
                enableImageTypes: [
                    ImageType.Primary,
                    ImageType.Backdrop,
                    ImageType.Thumb
                ]
            },
            {
                signal: options?.signal
            }
        );
        const items = response.data.Items ?? [];

        return gropsUpcomingEpisodes(items);
    }
};

export const useGetGroupsUpcomingEpisodes = (item: BaseItemDto | undefined) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['GroupsUpcomingEpisodes', item],
        queryFn: ({ signal }) =>
            fetchGetGroupsUpcomingEpisodes(currentApi, item, {
                signal: signal
            }),
        enabled: !!item?.Id
    });
};

const fetchGetItemsByFavoriteType = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    sections: Sections,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        let response;
        switch (sections.viewType) {
            case SectionsViewType.Artists: {
                response = (
                    await getArtistsApi(api).getArtists(
                        {
                            userId: user.Id,
                            parentId: parentId ?? undefined,
                            sortBy: [ItemSortBy.SortName],
                            sortOrder: [SortOrder.Ascending],
                            fields: [
                                ItemFields.PrimaryImageAspectRatio,
                                ItemFields.BasicSyncInfo
                            ],
                            isFavorite: true,
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
            case SectionsViewType.Persons: {
                response = (
                    await getPersonsApi(api).getPersons(
                        {
                            userId: user.Id,
                            sortBy: [ItemSortBy.SortName],
                            sortOrder: [SortOrder.Ascending],
                            fields: [
                                ItemFields.PrimaryImageAspectRatio,
                                ItemFields.BasicSyncInfo
                            ],
                            isFavorite: true,
                            limit: 25,
                            ...sections.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            default: {
                response = (
                    await getItemsApi(api).getItems(
                        {
                            userId: user.Id,
                            parentId: parentId ?? undefined,
                            sortBy: [ItemSortBy.SortName],
                            sortOrder: [SortOrder.Ascending],
                            fields: [
                                ItemFields.PrimaryImageAspectRatio,
                                ItemFields.BasicSyncInfo
                            ],
                            isFavorite: true,
                            collapseBoxSetItems: false,
                            limit: 25,
                            enableTotalRecordCount: false,
                            recursive: true,
                            excludeLocationTypes: [LocationType.Virtual],
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

export const useGetItemsByFavoriteType = (
    sections: Sections,
    parentId: ParentId
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['ItemsByFavoriteType', sections.view],
        queryFn: ({ signal }) =>
            fetchGetItemsByFavoriteType(currentApi, parentId, sections, {
                signal: signal
            }),
        enabled: !!sections.view
    });
};
