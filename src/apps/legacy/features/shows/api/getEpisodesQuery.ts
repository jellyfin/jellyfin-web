import type { Api } from '@jellyfin/sdk/lib/api';
import type { ShowApiGetEpisodesRequest } from '@jellyfin/sdk/lib/generated-client/api/show-api';
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api';
import { queryOptions } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

const fetchEpisodes = async (
    api: Api,
    params: ShowApiGetEpisodesRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getShowApi(api)
        .getEpisodes(params, options);
    return response.data;
};

/**
 * The key nests under the series item so invalidating a series drops its seasons
 * and episodes together.
 */
export const getEpisodesQuery = (
    api: Api | undefined,
    params: ShowApiGetEpisodesRequest
) => queryOptions({
    queryKey: [ 'User', params.userId, 'Items', params.seriesId, 'Episodes', params ],
    queryFn: ({ signal }) => fetchEpisodes(api!, params, { signal }),
    enabled: !!api
});
