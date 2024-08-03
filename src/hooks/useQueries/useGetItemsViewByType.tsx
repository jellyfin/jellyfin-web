import type { AxiosRequestConfig } from 'axios';
import {
    BaseItemKind,
    ImageType,
    ItemFields,
    ItemFilter,
    SortOrder
} from '@jellyfin/sdk/lib/generated-client';
import { getArtistsApi } from '@jellyfin/sdk/lib/utils/api/artists-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { getStudiosApi } from '@jellyfin/sdk/lib/utils/api/studios-api';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { JellyfinApiContext, useApi } from 'hooks/useApi';
import { ParentId, LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import {
    getFieldsQuery,
    getFiltersQuery,
    getLimitQuery,
    getAlphaPickerQuery
} from 'utils/items';

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
                        enableImageTypes: [
                            libraryViewSettings.ImageType,
                            ImageType.Backdrop
                        ],
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
                        enableImageTypes: [
                            libraryViewSettings.ImageType,
                            ImageType.Backdrop
                        ],
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
                        isFavorite:
                            libraryViewSettings.Filters?.Status?.includes(
                                ItemFilter.IsFavorite
                            ) ?
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
                        enableImageTypes: [
                            libraryViewSettings.ImageType,
                            ImageType.Backdrop
                        ],
                        ...getFieldsQuery(viewType, libraryViewSettings),
                        ...getFiltersQuery(viewType, libraryViewSettings),
                        ...getLimitQuery(),
                        ...getAlphaPickerQuery(libraryViewSettings),
                        isFavorite:
                            viewType === LibraryTab.Favorites ?
                                true :
                                undefined,
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
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
        enabled: [
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
            LibraryTab.Channels,
            LibraryTab.SeriesTimers
        ].includes(viewType)
    });
};
