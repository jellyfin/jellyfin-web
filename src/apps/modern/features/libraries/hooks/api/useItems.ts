import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk/lib/api';
import type { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { queryOptions, useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi';

const fetchGetItems = async (
    api: Api,
    params: LibraryApiGetItemsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getLibraryApi(api).getItems(params, options);
    return response.data;
};

export const getItemsQuery = (
    api: Api | undefined,
    params: LibraryApiGetItemsRequest
) => {
    const isRandom = Boolean(params.sortBy?.includes(ItemSortBy.Random));

    return queryOptions({
        queryKey: [ 'Items', params ],
        queryFn: ({ signal }) => fetchGetItems(api!, params, { signal }),
        gcTime: isRandom ? Infinity : undefined,
        refetchOnMount: isRandom ? false : undefined,
        refetchOnWindowFocus: isRandom ? false : undefined,
        enabled: !!api && !!params.userId
    });
};

export const useItems = (params: LibraryApiGetItemsRequest) => {
    const { api, user } = useApi();

    return useQuery(getItemsQuery(
        api,
        {
            ...params,
            userId: params.userId || user?.Id
        }
    ));
};
