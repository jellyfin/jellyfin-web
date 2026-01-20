import type { AxiosRequestConfig } from 'axios';
import type { ItemsApiGetItemsRequest, PlaylistsApiMoveItemRequest } from '@jellyfin/sdk/lib/generated-client';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { getArtistsApi } from '@jellyfin/sdk/lib/utils/api/artists-api';
import { getFilterApi } from '@jellyfin/sdk/lib/utils/api/filter-api';
import { getGenresApi } from '@jellyfin/sdk/lib/utils/api/genres-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getMoviesApi } from '@jellyfin/sdk/lib/utils/api/movies-api';
import { getStudiosApi } from '@jellyfin/sdk/lib/utils/api/studios-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import datetime from 'scripts/datetime';
import globalize from 'lib/globalize';

import { type JellyfinApiContext, useApi } from './useApi';
import { getAlphaPickerQuery, getFieldsQuery, getFiltersQuery, getLimitQuery } from 'utils/items';
import { getProgramSections, getSuggestionSections } from 'utils/sections';

import type { LibraryViewSettings, ParentId } from 'types/library';
import { type Section, type SectionType, SectionApiMethod } from 'types/sections';
import { LibraryTab } from 'types/libraryTab';
import { ItemKind } from 'types/base/models/item-kind';
import type { ItemDtoQueryResult } from 'types/base/models/item-dto-query-result';
import type { ItemDto } from 'types/base/models/item-dto';
import { logger } from 'utils/logger';

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
        return response.data as ItemDtoQueryResult;
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
        staleTime: parametersOptions.sortBy?.includes(ItemSortBy.Random) ? 300000 : 0,
        enabled: !!currentApi.api && !!currentApi.user?.Id
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
                    ItemFields.MediaSourceCount
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

export const useGetMovieRecommendations = (isMovieRecommendationEnabled: boolean, parentId: ParentId) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['MovieRecommendations', isMovieRecommendationEnabled, parentId],
        queryFn: ({ signal }) => fetchGetMovieRecommendations(currentApi, parentId, { signal }),
        enabled: !!currentApi.api && !!currentApi.user?.Id && isMovieRecommendationEnabled
    });
};

const fetchGetGenres = async (
    currentApi: JellyfinApiContext,
    itemType: BaseItemKind[],
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
                includeItemTypes: itemType,
                enableTotalRecordCount: false,
                parentId: parentId ?? undefined
            },
            {
                signal: options?.signal
            }
        );
        return response.data as ItemDtoQueryResult;
    }
};

export const useGetGenres = (itemType: BaseItemKind[], parentId: ParentId) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['Genres', parentId],
        queryFn: ({ signal }) =>
            fetchGetGenres(currentApi, itemType, parentId, { signal }),
        enabled: !!currentApi.api && !!currentApi.user?.Id && !!parentId
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
        return response.data.Items;
    }
};

export const useGetStudios = (parentId: ParentId, itemType: BaseItemKind[]) => {
    const currentApi = useApi();
    const isLivetv = parentId === 'livetv';
    return useQuery({
        queryKey: ['Studios', parentId, itemType],
        queryFn: ({ signal }) =>
            fetchGetStudios(currentApi, parentId, itemType, { signal }),
        enabled: !!currentApi.api && !!currentApi.user?.Id && !!parentId && !isLivetv
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
    const isLivetv = parentId === 'livetv';
    return useQuery({
        queryKey: ['QueryFiltersLegacy', parentId, itemType],
        queryFn: ({ signal }) =>
            fetchGetQueryFiltersLegacy(currentApi, parentId, itemType, {
                signal
            }),
        enabled: !!currentApi.api && !!currentApi.user?.Id && !!parentId && !isLivetv
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
            case LibraryTab.Channels: {
                response = await getLiveTvApi(api).getLiveTvChannels(
                    {
                        userId: user.Id,
                        fields: [ItemFields.PrimaryImageAspectRatio],
                        startIndex: libraryViewSettings.StartIndex,
                        isFavorite: libraryViewSettings.Filters?.Status?.includes(ItemFilter.IsFavorite) ?
                            true :
                            undefined,
                        enableImageTypes: [ImageType.Primary]
                    },
                    {
                        signal: options?.signal
                    }
                );
                break;
            }
            case LibraryTab.SeriesTimers:
                response = await getLiveTvApi(api).getSeriesTimers(
                    {
                        sortBy: 'SortName',
                        sortOrder: SortOrder.Ascending
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
        return response.data as ItemDtoQueryResult;
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
            {
                viewType,
                parentId,
                itemType,
                libraryViewSettings
            }
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
        staleTime: libraryViewSettings.SortBy === ItemSortBy.Random ? 300000 : 0,
        refetchOnWindowFocus: false,
        placeholderData : keepPreviousData,
        enabled: !!currentApi.api && !!currentApi.user?.Id
            && [
                LibraryTab.Movies,
                LibraryTab.Favorites,
                LibraryTab.Collections,
                LibraryTab.Series,
                LibraryTab.Episodes,
                LibraryTab.Networks,
                LibraryTab.Albums,
                LibraryTab.AlbumArtists,
                LibraryTab.Artists,
                LibraryTab.Playlists,
                LibraryTab.Songs,
                LibraryTab.Books,
                LibraryTab.PhotoAlbums,
                LibraryTab.Photos,
                LibraryTab.Videos,
                LibraryTab.Channels,
                LibraryTab.SeriesTimers
            ].includes(viewType)
    });
};

const fetchPlaylistsMoveItem = async (
    currentApi: JellyfinApiContext,
    requestParameters: PlaylistsApiMoveItemRequest
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getPlaylistsApi(api).moveItem({
            ...requestParameters
        });
        return response.data;
    }
};

export const usePlaylistsMoveItemMutation = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: (requestParameters: PlaylistsApiMoveItemRequest) =>
            fetchPlaylistsMoveItem(currentApi, requestParameters )
    });
};

type GroupsUpcomingEpisodes = {
    name: string;
    items: ItemDto[];
};

function groupsUpcomingEpisodes(items: ItemDto[]) {
    const groups: GroupsUpcomingEpisodes[] = [];
    let currentGroupName = '';
    let currentGroup: ItemDto[] = [];

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
            } catch {
                logger.error('Error parsing timestamp for upcoming TV shows', { component: 'UseFetchItems' });
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
    parentId: ParentId,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getTvShowsApi(api).getUpcomingEpisodes(
            {
                userId: user.Id,
                limit: 25,
                fields: [ItemFields.AirTime],
                parentId: parentId ?? undefined,
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
        const items = (response.data.Items as ItemDto[]) || [];

        return groupsUpcomingEpisodes(items);
    }
};

export const useGetGroupsUpcomingEpisodes = (parentId: ParentId) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['GroupsUpcomingEpisodes', parentId],
        queryFn: ({ signal }) =>
            fetchGetGroupsUpcomingEpisodes(currentApi, parentId, { signal }),
        enabled: !!currentApi.api && !!currentApi.user?.Id && !!parentId
    });
};

interface ToggleFavoriteMutationProp {
    itemId: string;
    isFavorite: boolean
}

const fetchUpdateFavoriteStatus = async (
    currentApi: JellyfinApiContext,
    itemId: string,
    isFavorite: boolean
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        if (isFavorite) {
            const response = await getUserLibraryApi(api).unmarkFavoriteItem({
                userId: user.Id,
                itemId: itemId
            });
            return response.data.IsFavorite;
        } else {
            const response = await getUserLibraryApi(api).markFavoriteItem({
                userId: user.Id,
                itemId: itemId
            });
            return response.data.IsFavorite;
        }
    }
};

export const useToggleFavoriteMutation = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: ({ itemId, isFavorite }: ToggleFavoriteMutationProp) =>
            fetchUpdateFavoriteStatus(currentApi, itemId, isFavorite )
    });
};

interface TogglePlayedMutationProp {
    itemId: string;
    isPlayed: boolean
}

const fetchUpdatePlayedState = async (
    currentApi: JellyfinApiContext,
    itemId: string,
    isPlayed: boolean
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        if (isPlayed) {
            const response = await getPlaystateApi(api).markUnplayedItem({
                userId: user.Id,
                itemId: itemId
            });
            return response.data.Played;
        } else {
            const response = await getPlaystateApi(api).markPlayedItem({
                userId: user.Id,
                itemId: itemId
            });
            return response.data.Played;
        }
    }
};

export const useTogglePlayedMutation = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: ({ itemId, isPlayed }: TogglePlayedMutationProp) =>
            fetchUpdatePlayedState(currentApi, itemId, isPlayed )
    });
};

export type GroupsTimers = {
    name: string;
    timerInfo: ItemDto[];
};

function groupsTimers(timers: ItemDto[], indexByDate?: boolean) {
    const items = timers.map((t) => {
        t.Type = ItemKind.Timer;
        return t;
    });
    const groups: GroupsTimers[] = [];
    let currentGroupName = '';
    let currentGroup: ItemDto[] = [];

    for (const item of items) {
        let dateText = '';

        if (indexByDate !== false && item.StartDate) {
            try {
                const premiereDate = datetime.parseISO8601Date(item.StartDate, true);
                dateText = datetime.toLocaleDateString(premiereDate, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (err) {
                logger.error(`Error parsing premiereDate: ${item.StartDate}`, { component: 'UseFetchItems' }, err as Error);
            }
        }

        if (dateText != currentGroupName) {
            if (currentGroup.length) {
                groups.push({
                    name: currentGroupName,
                    timerInfo: currentGroup
                });
            }

            currentGroupName = dateText;
            currentGroup = [item];
        } else {
            currentGroup.push(item);
        }
    }

    if (currentGroup.length) {
        groups.push({
            name: currentGroupName,
            timerInfo: currentGroup
        });
    }
    return groups;
}

const fetchGetTimers = async (
    currentApi: JellyfinApiContext,
    indexByDate?: boolean,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getLiveTvApi(api).getTimers(
            {
                isActive: false,
                isScheduled: true
            },
            {
                signal: options?.signal
            }
        );

        const timers = (response.data.Items as ItemDto[]) || [];

        return groupsTimers(timers, indexByDate);
    }
};

export const useGetTimers = (isUpcomingRecordingsEnabled: boolean, indexByDate?: boolean) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['Timers', { isUpcomingRecordingsEnabled, indexByDate }],
        queryFn: ({ signal }) => fetchGetTimers(currentApi, indexByDate, { signal }),
        enabled: !!currentApi.api && !!currentApi.user?.Id && isUpcomingRecordingsEnabled
    });
};

const fetchGetSectionItems = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    section: Section,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        let response;
        switch (section.apiMethod) {
            case SectionApiMethod.RecommendedPrograms: {
                response = (
                    await getLiveTvApi(api).getRecommendedPrograms(
                        {
                            userId: user.Id,
                            limit: 12,
                            imageTypeLimit: 1,
                            enableImageTypes: [ImageType.Primary, ImageType.Thumb, ImageType.Backdrop],
                            enableTotalRecordCount: false,
                            fields: [
                                ItemFields.ChannelInfo,
                                ItemFields.PrimaryImageAspectRatio,
                                ItemFields.MediaSourceCount
                            ],
                            ...section.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            case SectionApiMethod.LiveTvPrograms: {
                response = (
                    await getLiveTvApi(api).getLiveTvPrograms(
                        {
                            userId: user.Id,
                            limit: 12,
                            imageTypeLimit: 1,
                            enableImageTypes: [ImageType.Primary, ImageType.Thumb, ImageType.Backdrop],
                            enableTotalRecordCount: false,
                            fields: [
                                ItemFields.ChannelInfo,
                                ItemFields.PrimaryImageAspectRatio
                            ],
                            ...section.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            case SectionApiMethod.Recordings: {
                response = (
                    await getLiveTvApi(api).getRecordings(
                        {
                            userId: user.Id,
                            enableImageTypes: [ImageType.Primary, ImageType.Thumb, ImageType.Backdrop],
                            enableTotalRecordCount: false,
                            fields: [
                                ItemFields.CanDelete,
                                ItemFields.PrimaryImageAspectRatio
                            ],
                            ...section.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            case SectionApiMethod.RecordingFolders: {
                response = (
                    await getLiveTvApi(api).getRecordingFolders(
                        {
                            userId: user.Id
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            case SectionApiMethod.NextUp: {
                response = (
                    await getTvShowsApi(api).getNextUp(
                        {
                            userId: user.Id,
                            limit: 25,
                            fields: [
                                ItemFields.PrimaryImageAspectRatio,
                                ItemFields.MediaSourceCount
                            ],
                            parentId: parentId ?? undefined,
                            imageTypeLimit: 1,
                            enableImageTypes: [
                                ImageType.Primary,
                                ImageType.Thumb,
                                ImageType.Backdrop
                            ],
                            enableTotalRecordCount: false,
                            ...section.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            case SectionApiMethod.ResumeItems: {
                response = (
                    await getItemsApi(api).getResumeItems(
                        {
                            userId: user.Id,
                            parentId: parentId ?? undefined,
                            fields: [
                                ItemFields.PrimaryImageAspectRatio,
                                ItemFields.MediaSourceCount
                            ],
                            imageTypeLimit: 1,
                            enableImageTypes: [
                                ImageType.Primary,
                                ImageType.Thumb,
                                ImageType.Backdrop
                            ],
                            enableTotalRecordCount: false,
                            ...section.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            case SectionApiMethod.LatestMedia: {
                response = (
                    await getUserLibraryApi(api).getLatestMedia(
                        {
                            userId: user.Id,
                            fields: [
                                ItemFields.PrimaryImageAspectRatio,
                                ItemFields.MediaSourceCount
                            ],
                            parentId: parentId ?? undefined,
                            imageTypeLimit: 1,
                            enableImageTypes: [ImageType.Primary, ImageType.Thumb],
                            ...section.parametersOptions
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
                            limit: 25,
                            enableTotalRecordCount: false,
                            ...section.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
        }
        return response as ItemDto[] || [] ;
    }
};

type SectionWithItems = {
    section: Section;
    items: ItemDto[];
};

const getSectionsWithItems = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    sections: Section[],
    sectionType?: SectionType[],
    options?: AxiosRequestConfig
) => {
    if (sectionType) {
        sections = sections.filter((section) => sectionType.includes(section.type));
    }

    const updatedSectionWithItems: SectionWithItems[] = [];

    for (const section of sections) {
        const items = await fetchGetSectionItems(
            currentApi, parentId, section, options
        );

        if (items && items.length > 0) {
            updatedSectionWithItems.push({
                section,
                items
            });
        }
    }

    return updatedSectionWithItems;
};

export const useGetSuggestionSectionsWithItems = (
    parentId: ParentId,
    suggestionSectionType: SectionType[]
) => {
    const currentApi = useApi();
    const sections = getSuggestionSections();
    return useQuery({
        queryKey: ['SuggestionSectionWithItems', { suggestionSectionType }],
        queryFn: ({ signal }) =>
            getSectionsWithItems(currentApi, parentId, sections, suggestionSectionType, { signal }),
        enabled: !!currentApi.api && !!currentApi.user?.Id && !!parentId
    });
};

export const useGetProgramsSectionsWithItems = (
    parentId: ParentId,
    programSectionType: SectionType[]
) => {
    const currentApi = useApi();
    const sections = getProgramSections();
    return useQuery({
        queryKey: ['ProgramSectionWithItems', { programSectionType }],
        queryFn: ({ signal }) => getSectionsWithItems(currentApi, parentId, sections, programSectionType, { signal }),
        enabled: !!currentApi.api && !!currentApi.user?.Id
    });
};
