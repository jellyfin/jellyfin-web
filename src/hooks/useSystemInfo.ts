import { useQuery } from '@tanstack/react-query';
import type { Api } from '@jellyfin/sdk';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from './useApi';
import { queryOptions } from 'utils/query/queryOptions';

const fetchSystemInfo = async (
    api?: Api,
    options?: AxiosRequestConfig
) => {
    if (!api) {
        console.warn('[fetchSystemInfo] No API instance available');
        return;
    }

    const response = await getSystemApi(api)
        .getSystemInfo(options);
    return response.data;
};

export const getSystemInfoQuery = (
    api?: Api
) => queryOptions({
    queryKey: [ 'SystemInfo' ],
    queryFn: ({ signal }) => fetchSystemInfo(api, { signal }),
    // Allow for query reuse in legacy javascript.
    staleTime: 1000, // 1 second
    enabled: !!api
});

export const useSystemInfo = () => {
    const { api } = useApi();
    return useQuery(getSystemInfoQuery(api));
};
