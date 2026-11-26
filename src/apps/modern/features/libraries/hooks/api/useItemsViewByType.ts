import type { AxiosRequestConfig } from 'axios';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { getPersonApi } from '@jellyfin/sdk/lib/utils/api/person-api';
import { getStudioApi } from '@jellyfin/sdk/lib/utils/api/studio-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { VIDEO_PERSON_KINDS } from 'apps/modern/features/libraries/constants/personKinds';

import { type JellyfinApiContext, useApi } from 'hooks/useApi';
import { getAlphaPickerQuery, getFieldsQuery, getFiltersQuery } from 'utils/items';
import * as userSettings from 'scripts/settings/userSettings';

import type { LibraryViewSettings, ParentId } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import type { ItemDtoQueryResult } from 'types/base/models/item-dto-query-result';

const DEFAULT_LIBRARY_PAGE_SIZE = 100;

const fetchGetItemsViewByType = async (
    currentApi: JellyfinApiContext,
    viewType: LibraryTab | undefined,
    parentId: ParentId,
    itemType: BaseItemKind[],
    libraryViewSettings: LibraryViewSettings,
    pagination: { startIndex: number, limit: number },
    options?: AxiosRequestConfig
) => {
    const { startIndex, limit } = pagination;
    const { api, user } = currentApi;
    if (api && user?.Id && viewType) {
        const isFavorite = libraryViewSettings.Filters?.Status?.includes(ItemFilter.IsFavorite) || undefined;
        let response;
        switch (viewType) {
            case LibraryTab.AlbumArtists: {
                response = await getPersonApi(api).getPersons(
                    {
                        userId: user.Id,
                        parentId: parentId ?? undefined,
                        enableImageTypes: [libraryViewSettings.ImageType, ImageType.Backdrop],
                        ...getFieldsQuery(viewType, libraryViewSettings),
                        ...getFiltersQuery(viewType, libraryViewSettings),
                        limit,
                        ...getAlphaPickerQuery(libraryViewSettings),
                        personTypes: [PersonKind.AlbumArtist],
                        startIndex
                    },
                    {
                        signal: options?.signal
                    }
                );
                break;
            }
            case LibraryTab.Artists: {
                response = await getPersonApi(api).getPersons(
                    {
                        userId: user.Id,
                        parentId: parentId ?? undefined,
                        enableImageTypes: [libraryViewSettings.ImageType, ImageType.Backdrop],
                        ...getFieldsQuery(viewType, libraryViewSettings),
                        ...getFiltersQuery(viewType, libraryViewSettings),
                        limit,
                        ...getAlphaPickerQuery(libraryViewSettings),
                        personTypes: [PersonKind.Artist],
                        startIndex
                    },
                    {
                        signal: options?.signal
                    }
                );
                break;
            }
            case LibraryTab.Authors: {
                response = await getPersonApi(api).getPersons(
                    {
                        userId: user.Id,
                        parentId: parentId ?? undefined,
                        enableImageTypes: [libraryViewSettings.ImageType, ImageType.Backdrop],
                        fields: [ItemFields.PrimaryImageAspectRatio],
                        filters: libraryViewSettings?.Filters?.Status,
                        limit,
                        ...getAlphaPickerQuery(libraryViewSettings),
                        personTypes: [PersonKind.Author],
                        startIndex
                    },
                    {
                        signal: options?.signal
                    }
                );
                break;
            }
            case LibraryTab.Persons: {
                response = await getPersonApi(api).getPersons(
                    {
                        userId: user.Id,
                        parentId: parentId ?? undefined,
                        enableImageTypes: [libraryViewSettings.ImageType, ImageType.Backdrop],
                        fields: [ItemFields.PrimaryImageAspectRatio],
                        filters: libraryViewSettings?.Filters?.Status,
                        limit,
                        ...getAlphaPickerQuery(libraryViewSettings),
                        personTypes: libraryViewSettings?.Filters?.PersonKinds?.length ? libraryViewSettings.Filters.PersonKinds : VIDEO_PERSON_KINDS,
                        startIndex
                    },
                    {
                        signal: options?.signal
                    }
                );
                break;
            }
            case LibraryTab.Studios:
                response = await getStudioApi(api).getStudios(
                    {
                        userId: user.Id,
                        parentId: parentId ?? undefined,
                        ...getFieldsQuery(viewType, libraryViewSettings),
                        limit,
                        ...getAlphaPickerQuery(libraryViewSettings),
                        includeItemTypes: itemType,
                        isFavorite,
                        enableImageTypes: [ImageType.Thumb],
                        startIndex
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
                        startIndex,
                        isFavorite,
                        enableImageTypes: [ImageType.Primary]
                    },
                    {
                        signal: options?.signal
                    }
                );
                break;
            }
            case LibraryTab.Folders: {
                response = await getLibraryApi(api).getItems(
                    {
                        userId: user.Id,
                        recursive: false,
                        imageTypeLimit: 1,
                        parentId: parentId ?? undefined,
                        enableImageTypes: [libraryViewSettings.ImageType, ImageType.Backdrop],
                        ...getFieldsQuery(viewType, libraryViewSettings),
                        ...getFiltersQuery(viewType, libraryViewSettings),
                        limit,
                        ...getAlphaPickerQuery(libraryViewSettings),
                        sortBy: libraryViewSettings.SortBy,
                        sortOrder: [libraryViewSettings.SortOrder],
                        includeItemTypes: itemType,
                        startIndex
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
                response = await getLibraryApi(api).getItems(
                    {
                        userId: user.Id,
                        recursive: true,
                        imageTypeLimit: 1,
                        parentId: parentId ?? undefined,
                        enableImageTypes: [libraryViewSettings.ImageType, ImageType.Backdrop],
                        ...getFieldsQuery(viewType, libraryViewSettings),
                        ...getFiltersQuery(viewType, libraryViewSettings),
                        limit,
                        ...getAlphaPickerQuery(libraryViewSettings),
                        isFavorite: viewType === LibraryTab.Favorites ? true : undefined,
                        sortBy: libraryViewSettings.SortBy,
                        sortOrder: [libraryViewSettings.SortOrder],
                        includeItemTypes: itemType,
                        startIndex
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

    return {};
};

export const useGetItemsViewByType = (
    viewType: LibraryTab | undefined,
    parentId: ParentId,
    itemType: BaseItemKind[] = [],
    libraryViewSettings: LibraryViewSettings
) => {
    const currentApi = useApi();
    const pageSize = userSettings.libraryPageSize(undefined) || DEFAULT_LIBRARY_PAGE_SIZE;
    // StartIndex is tracked by the pages themselves now, so it is excluded from the
    // query key to keep already fetched pages in the cache.
    const settingsKey = useMemo(
        () => ({ ...libraryViewSettings, StartIndex: undefined }),
        [libraryViewSettings]
    );

    return useInfiniteQuery({
        queryKey: [
            'User',
            currentApi.user?.Id,
            'Items',
            parentId,
            'ViewByType',
            viewType,
            {
                itemType,
                settingsKey
            }
        ],
        queryFn: ({ pageParam, signal }) =>
            fetchGetItemsViewByType(
                currentApi,
                viewType,
                parentId,
                itemType,
                libraryViewSettings!,
                { startIndex: pageParam, limit: pageSize },
                { signal }
            ),
        initialPageParam: libraryViewSettings.StartIndex ?? 0,
        getNextPageParam: (lastPage) => {
            const nextStartIndex = (lastPage.StartIndex ?? 0) + (lastPage.Items?.length ?? 0);
            return nextStartIndex < (lastPage.TotalRecordCount ?? 0) ? nextStartIndex : undefined;
        },
        refetchOnWindowFocus: false,
        enabled: !!currentApi.api && !!currentApi.user?.Id
            && viewType
            && [
                LibraryTab.Movies,
                LibraryTab.Favorites,
                LibraryTab.Collections,
                LibraryTab.Series,
                LibraryTab.Episodes,
                LibraryTab.Studios,
                LibraryTab.Albums,
                LibraryTab.AlbumArtists,
                LibraryTab.Artists,
                LibraryTab.Authors,
                LibraryTab.Persons,
                LibraryTab.Playlists,
                LibraryTab.Songs,
                LibraryTab.Books,
                LibraryTab.PhotoAlbums,
                LibraryTab.Photos,
                LibraryTab.Videos,
                LibraryTab.Channels,
                LibraryTab.SeriesTimers,
                LibraryTab.MusicVideos,
                LibraryTab.Folders,
                LibraryTab.Mixed
            ].includes(viewType)
    });
};
