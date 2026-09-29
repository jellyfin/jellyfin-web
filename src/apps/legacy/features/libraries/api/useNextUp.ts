import type { Api } from '@jellyfin/sdk/lib/api';
import type { ShowApiGetNextUpRequest } from '@jellyfin/sdk/lib/generated-client/api/show-api';
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

const fetchNextUp = async (
    api: Api,
    params?: ShowApiGetNextUpRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getShowApi(api)
        .getNextUp(params, options);
    return response.data;
};

export const getNextUpQuery = (
    api?: Api,
    params?: ShowApiGetNextUpRequest
) => queryOptions({
    queryKey: [ 'User', params?.userId, 'NextUp', params ],
    queryFn: ({ signal }) => fetchNextUp(api!, params, { signal }),
    enabled: !!api
});

export const useNextUp = (
    params?: ShowApiGetNextUpRequest
) => {
    const { api, user } = useApi();
    return useQuery(getNextUpQuery(api, {
        ...params,
        userId: params?.userId || user?.Id
    }));
};
