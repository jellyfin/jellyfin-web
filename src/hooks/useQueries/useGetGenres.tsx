import type { AxiosRequestConfig } from 'axios';
import {
    BaseItemKind,
    ItemSortBy,
    SortOrder
} from '@jellyfin/sdk/lib/generated-client';
import { getGenresApi } from '@jellyfin/sdk/lib/utils/api/genres-api';
import { useQuery } from '@tanstack/react-query';
import { JellyfinApiContext, useApi } from 'hooks/useApi';
import { ParentId } from 'types/library';

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
        return response.data;
    }
};

export const useGetGenres = (itemType: BaseItemKind[], parentId: ParentId) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['Genres', parentId],
        queryFn: ({ signal }) =>
            fetchGetGenres(currentApi, itemType, parentId, { signal }),
        enabled: !!parentId
    });
};
