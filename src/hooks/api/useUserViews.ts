import type { Api } from '@jellyfin/sdk/lib/api';
import type { UserViewsApiGetUserViewsRequest } from '@jellyfin/sdk/lib/generated-client/api/user-views-api';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from '../useApi';

const fetchUserViews = async (
    api: Api,
    params?: UserViewsApiGetUserViewsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getUserViewsApi(api)
        .getUserViews(params, options);
    return response.data;
};

export const getUserViewsQuery = (
    api?: Api,
    params?: UserViewsApiGetUserViewsRequest
) => queryOptions({
    queryKey: [ 'User', params?.userId, 'Views', params ],
    queryFn: ({ signal }) => fetchUserViews(api!, params, { signal }),
    // On initial page load we request user views 3x. Setting a 1 second stale time
    // allows a single request to be made to resolve all 3.
    staleTime: 1000, // 1 second
    enabled: !!api
});

export const useUserViews = (
    params?: UserViewsApiGetUserViewsRequest
) => {
    const { api, user } = useApi();
    return useQuery(getUserViewsQuery(api, {
        ...params,
        userId: params?.userId || user?.Id
    }));
};
