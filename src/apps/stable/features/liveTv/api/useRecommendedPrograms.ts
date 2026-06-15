import type { Api } from '@jellyfin/sdk/lib/api';
import type { LiveTvApiGetRecommendedProgramsRequest } from '@jellyfin/sdk/lib/generated-client/api/live-tv-api';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

const fetchRecommendedPrograms = async (
    api: Api,
    params?: LiveTvApiGetRecommendedProgramsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getLiveTvApi(api)
        .getRecommendedPrograms(params, options);
    return response.data;
};

export const getRecommendedProgramsQuery = (
    api?: Api,
    params?: LiveTvApiGetRecommendedProgramsRequest
) => queryOptions({
    queryKey: [ 'User', params?.userId, 'RecommendedPrograms', params ],
    queryFn: ({ signal }) => fetchRecommendedPrograms(api!, params, { signal }),
    enabled: !!api
});

export const useRecommendedPrograms = (
    params?: LiveTvApiGetRecommendedProgramsRequest
) => {
    const { api, user } = useApi();
    return useQuery(getRecommendedProgramsQuery(api, {
        ...params,
        userId: params?.userId || user?.Id
    }));
};
