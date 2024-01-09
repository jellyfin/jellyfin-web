import { useQuery } from '@tanstack/react-query';
import type { Api } from '@jellyfin/sdk';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import type { AxiosRequestConfig } from 'axios';

const fetchSystemInfo = async (
    api: Api | undefined,
    options: AxiosRequestConfig
) => {
    if (!api) throw new Error('No API instance available');

    const response = await getSystemApi(api)
        .getSystemInfo(options);
    return response.data;
};

export const useSystemInfo = (api: Api | undefined) => {
    return useQuery({
        queryKey: [ 'SystemInfo' ],
        queryFn: ({ signal }) => fetchSystemInfo(api, { signal }),
        enabled: !!api
    });
};
