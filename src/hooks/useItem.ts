import type { Api } from '@jellyfin/sdk/lib/api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from './useApi';

const fetchItem = async (
    api?: Api,
    userId?: string,
    itemId?: string,
    options?: AxiosRequestConfig
) => {
    if (!api) throw new Error('No API instance available');
    if (!itemId) throw new Error('No item ID provided');

    const response = await getUserLibraryApi(api)
        .getItem({ userId, itemId }, options);
    return response.data;
};

export const getItemQuery = (
    api?: Api,
    userId?: string,
    itemId?: string
) => queryOptions({
    queryKey: [ 'User', userId, 'Items', itemId ],
    queryFn: ({ signal }) => fetchItem(api, userId, itemId, { signal }),
    staleTime: 1000, // 1 second
    enabled: !!api && !!userId && !!itemId
});

export const useItem = (
    itemId?: string
) => {
    const apiContext = useApi();
    const { api, user } = apiContext;
    return useQuery(getItemQuery(api, user?.Id, itemId));
};
