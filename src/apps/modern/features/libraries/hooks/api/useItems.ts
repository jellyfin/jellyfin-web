import type { AxiosRequestConfig } from 'axios';
import type { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { useQuery } from '@tanstack/react-query';

import { type JellyfinApiContext, useApi } from 'hooks/useApi';
import type { ItemDtoQueryResult } from 'types/base/models/item-dto-query-result';

const fetchGetItems = async (
    currentApi: JellyfinApiContext,
    parametersOptions: LibraryApiGetItemsRequest,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getLibraryApi(api).getItems(
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

export const useItems = (parametersOptions: LibraryApiGetItemsRequest) => {
    const currentApi = useApi();
    const isRandom = Boolean(parametersOptions.sortBy?.includes(ItemSortBy.Random));

    return useQuery({
        queryKey: [
            'Items',
            {
                ...parametersOptions
            }
        ],
        queryFn: ({ signal }) =>
            fetchGetItems(currentApi, parametersOptions, { signal }),
        gcTime: isRandom ? Infinity : undefined,
        refetchOnMount: isRandom ? false : undefined,
        refetchOnWindowFocus: isRandom ? false : undefined,
        enabled: !!currentApi.api && !!currentApi.user?.Id
    });
};
