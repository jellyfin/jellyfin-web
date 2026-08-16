import type { Api } from '@jellyfin/sdk/lib/api';
import type { ShowApiGetSeasonsRequest } from '@jellyfin/sdk/lib/generated-client/api/show-api';
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api';
import { queryOptions } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

const fetchSeasons = async (
    api: Api,
    params: ShowApiGetSeasonsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getShowApi(api)
        .getSeasons(params, options);
    return response.data;
};

/**
 * The key nests under the series item so invalidating a series drops its seasons
 * and episodes together.
 */
export const getSeasonsQuery = (
    api: Api | undefined,
    params: ShowApiGetSeasonsRequest
) => queryOptions({
    queryKey: [ 'User', params.userId, 'Items', params.seriesId, 'Seasons', params ],
    queryFn: ({ signal }) => fetchSeasons(api!, params, { signal }),
    enabled: !!api
});
