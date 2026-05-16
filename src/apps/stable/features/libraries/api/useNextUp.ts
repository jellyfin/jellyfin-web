import type { Api } from '@jellyfin/sdk/lib/api';
import type { TvShowsApiGetNextUpRequest } from '@jellyfin/sdk/lib/generated-client/api/tv-shows-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

const fetchNextUp = async (
    api: Api,
    params?: TvShowsApiGetNextUpRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getTvShowsApi(api)
        .getNextUp(params, options);
    return response.data;
};

export const getNextUpQuery = (
    api?: Api,
    params?: TvShowsApiGetNextUpRequest
) => queryOptions({
    queryKey: [ 'User', params?.userId, 'NextUp', params ],
    queryFn: ({ signal }) => fetchNextUp(api!, params, { signal }),
    enabled: !!api
});

export const useNextUp = (
    params?: TvShowsApiGetNextUpRequest
) => {
    const { api, user } = useApi();
    return useQuery(getNextUpQuery(api, {
        ...params,
        userId: params?.userId || user?.Id
    }));
};
