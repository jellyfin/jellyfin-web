import type { Api } from '@jellyfin/sdk/lib/api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from './useApi';
import type { ItemDto } from '@/types/base/models/item-dto';

const fetchItem = async (
    api: Api,
    itemId: string,
    userId: string,
    options?: AxiosRequestConfig
) => {
    const response = await getUserLibraryApi(api)
        .getItem({ userId, itemId }, options);
    return response.data as ItemDto;
};

export const getItemQuery = (
    api: Api | undefined,
    itemId?: string,
    userId?: string
) => queryOptions({
    queryKey: [ 'User', userId, 'Items', itemId ],
    queryFn: ({ signal }) => fetchItem(api!, itemId!, userId!, { signal }),
    staleTime: 1000, // 1 second
    enabled: !!api && !!userId && !!itemId
});

export const useItem = (
    itemId?: string
) => {
    const apiContext = useApi();
    const { api, user } = apiContext;
    return useQuery(getItemQuery(api, itemId, user?.Id));
};
