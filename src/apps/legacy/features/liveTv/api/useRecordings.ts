import type { Api } from '@jellyfin/sdk';
import type { LiveTvApiGetRecordingsRequest } from '@jellyfin/sdk/lib/generated-client/api/live-tv-api';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

const fetchRecordings = async (
    api: Api,
    params?: LiveTvApiGetRecordingsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getLiveTvApi(api).getRecordings(params, options);
    return response.data;
};

export const getRecordingsQuery = (
    api?: Api,
    params?: LiveTvApiGetRecordingsRequest
) => queryOptions({
    queryKey: [ 'User', params?.userId, 'Recordings', params ],
    queryFn: ({ signal }) => fetchRecordings(api!, params, { signal }),
    enabled: !!api
});

export const useRecordings = (
    params?: LiveTvApiGetRecordingsRequest
) => {
    const { api, user } = useApi();
    return useQuery(getRecordingsQuery(api, {
        ...params,
        userId: params?.userId || user?.Id
    }));
};
