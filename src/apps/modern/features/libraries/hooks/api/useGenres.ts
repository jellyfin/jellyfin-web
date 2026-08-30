import type { Api } from '@jellyfin/sdk/lib/api';
import type { GenreApiGetGenresRequest } from '@jellyfin/sdk/lib/generated-client/api/genre-api';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { getGenreApi } from '@jellyfin/sdk/lib/utils/api/genre-api';
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';
import type { ItemDtoQueryResult } from 'types/base/models/item-dto-query-result';
import type { ParentId } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

import {
    type AlphabetNavigationSettings,
    getAlphabetFilter,
    getAlphabetNavigationSettings
} from '../../utils/alphabet';

export const GENRES_PAGE_SIZE = 10;

interface GenresParams {
    parentId?: ParentId;
    includeItemTypes?: BaseItemKind[];
    /** Filter by the first letter of the genre name; '#' matches the Other bucket in localized mode. */
    alphabet?: string | null;
    alphabetNavigationSettings?: AlphabetNavigationSettings;
    enabled?: boolean;
    userId?: string;
}

const fetchGenres = async (
    api: Api,
    params: GenreApiGetGenresRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getGenreApi(api).getGenres(params, options);
    return response.data as ItemDtoQueryResult;
};

/** Query options for fetching genres. */
export const getGenresQuery = (
    api?: Api,
    params: GenresParams = {}
) => {
    const alphabetNavigationSettings = params.alphabetNavigationSettings
        ?? getAlphabetNavigationSettings();
    const alphabetFilter = getAlphabetFilter(
        params.alphabet,
        alphabetNavigationSettings,
        LibraryTab.Genres
    );

    return infiniteQueryOptions({
        queryKey: [
            'Genres',
            params.parentId,
            params.includeItemTypes,
            params.alphabet,
            alphabetNavigationSettings
        ],
        queryFn: ({ pageParam, signal }) => fetchGenres(
            api!,
            {
                userId: params.userId,
                includeItemTypes: params.includeItemTypes,
                parentId: params.parentId ?? undefined,
                sortBy: [ItemSortBy.SortName],
                sortOrder: [SortOrder.Ascending],
                ...alphabetFilter.query,
                enableTotalRecordCount: false,
                startIndex: pageParam * GENRES_PAGE_SIZE,
                limit: GENRES_PAGE_SIZE
            },
            {
                signal,
                params: alphabetFilter.params
            }
        ),
        initialPageParam: 0,
        // Stop once a page returns fewer items than requested (cheaper than enabling total record count)
        getNextPageParam: (lastPage, allPages) =>
            (lastPage?.Items?.length ?? 0) < GENRES_PAGE_SIZE ? undefined : allPages.length,
        enabled: params.enabled !== false && !!api && !!params.userId && !!params.parentId
    });
};

/** Hook for fetching genres. */
export const useGenres = (params?: GenresParams) => {
    const { api, user } = useApi();
    return useInfiniteQuery(getGenresQuery(
        api,
        {
            ...params,
            userId: params?.userId || user?.Id
        }
    ));
};
