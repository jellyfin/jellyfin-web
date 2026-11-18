import type { Api } from '@jellyfin/sdk/lib/api';
import type { MovieApiGetMovieRecommendationsRequest } from '@jellyfin/sdk/lib/generated-client/api/movie-api';
import { getMovieApi } from '@jellyfin/sdk/lib/utils/api/movie-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

const fetchGetMovieRecommendations = async (
    api: Api,
    params: MovieApiGetMovieRecommendationsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getMovieApi(api).getMovieRecommendations(params, options);
    return response.data;
};

/** Query options for fetching movie recommendations. */
export const getMovieRecommendationsQuery = (
    api?: Api,
    params: MovieApiGetMovieRecommendationsRequest = {},
    enabled = true
) => queryOptions({
    queryKey: ['MovieRecommendations', params?.parentId],
    queryFn: ({ signal }) => fetchGetMovieRecommendations(api!, params, { signal }),
    enabled: !!api && enabled
});

/** Hook for fetching movie recommendations. */
export const useMovieRecommendations = (
    params?: MovieApiGetMovieRecommendationsRequest,
    enabled?: boolean
) => {
    const { api, user } = useApi();
    return useQuery(getMovieRecommendationsQuery(
        api,
        {
            ...params,
            userId: params?.userId || user?.Id
        },
        enabled
    ));
};
