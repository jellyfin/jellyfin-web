import type { Api } from '@jellyfin/sdk/lib/api';
import type { ItemsApiGetResumeItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/items-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

const fetchResumeItems = async (
    api: Api,
    params?: ItemsApiGetResumeItemsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getItemsApi(api)
        .getResumeItems(params, options);
    return response.data;
};

export const getResumeItemsQuery = (
    api?: Api,
    params?: ItemsApiGetResumeItemsRequest
) => queryOptions({
    queryKey: [ 'User', params?.userId, 'ResumeItems', params ],
    queryFn: ({ signal }) => fetchResumeItems(api!, params, { signal }),
    enabled: !!api
});

export const useResumeItems = (
    params?: ItemsApiGetResumeItemsRequest
) => {
    const { api, user } = useApi();
    return useQuery(getResumeItemsQuery(api, {
        ...params,
        userId: params?.userId || user?.Id
    }));
};
