import type { Api } from '@jellyfin/sdk/lib/api';
import type { UserViewsApiGetUserViewsRequest } from '@jellyfin/sdk/lib/generated-client/api/user-views-api';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api';
import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { queryOptions } from 'utils/query/queryOptions';

import { useApi } from './useApi';

const fetchUserViews = async (
    api?: Api,
    userId?: string,
    params?: UserViewsApiGetUserViewsRequest,
    options?: AxiosRequestConfig
) => {
    if (!api) throw new Error('No API instance available');
    if (!userId) throw new Error('No User ID provided');

    const response = await getUserViewsApi(api)
        .getUserViews({ ...params, userId }, options);
    return response.data;
};

export const getUserViewsQuery = (
    api?: Api,
    userId?: string,
    params?: UserViewsApiGetUserViewsRequest
) => queryOptions({
    queryKey: [ 'User', userId, 'Views', params ],
    queryFn: ({ signal }) => fetchUserViews(api, userId, params, { signal }),
    // On initial page load we request user views 3x. Setting a 1 second stale time
    // allows a single request to be made to resolve all 3.
    staleTime: 1000, // 1 second
    enabled: !!api && !!userId
});

export const useUserViews = (
    userId?: string,
    params?: UserViewsApiGetUserViewsRequest
) => {
    const apiContext = useApi();
    const { api } = apiContext;
    return useQuery(getUserViewsQuery(api, userId, params));
};
