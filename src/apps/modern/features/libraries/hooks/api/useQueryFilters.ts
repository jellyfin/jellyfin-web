import type { AxiosRequestConfig } from 'axios';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { getFilterApi } from '@jellyfin/sdk/lib/utils/api/filter-api';
import { useQuery } from '@tanstack/react-query';

import { type JellyfinApiContext, useApi } from 'hooks/useApi';
import type { ParentId } from 'types/library';

const fetchGetQueryFilters = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    itemType: BaseItemKind[],
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getFilterApi(api).getQueryFilters(
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

export const useGetQueryFilters = (
    parentId: ParentId,
    itemType: BaseItemKind[]
) => {
    const currentApi = useApi();
    const isLivetv = parentId === 'livetv';
    return useQuery({
        queryKey: ['QueryFilters', parentId, itemType],
        queryFn: ({ signal }) =>
            fetchGetQueryFilters(currentApi, parentId, itemType, {
                signal
            }),
        enabled: !!currentApi.api && !!currentApi.user?.Id && !!parentId && !isLivetv
    });
};
