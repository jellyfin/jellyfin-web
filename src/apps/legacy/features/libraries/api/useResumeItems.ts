import type { Api } from '@jellyfin/sdk/lib/api';
import type { LibraryApiGetResumeItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

const fetchResumeItems = async (
    api: Api,
    params?: LibraryApiGetResumeItemsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getLibraryApi(api)
        .getResumeItems(params, options);
    return response.data;
};

export const getResumeItemsQuery = (
    api?: Api,
    params?: LibraryApiGetResumeItemsRequest
) => queryOptions({
    queryKey: [ 'User', params?.userId, 'ResumeItems', params ],
    queryFn: ({ signal }) => fetchResumeItems(api!, params, { signal }),
    enabled: !!api
});

export const useResumeItems = (
    params?: LibraryApiGetResumeItemsRequest
) => {
    const { api, user } = useApi();
    return useQuery(getResumeItemsQuery(api, {
        ...params,
        userId: params?.userId || user?.Id
    }));
};
