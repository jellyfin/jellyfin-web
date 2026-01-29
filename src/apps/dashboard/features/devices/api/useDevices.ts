import type { Api } from '@jellyfin/sdk';
import type { DevicesApiGetDevicesRequest } from '@jellyfin/sdk/lib/generated-client';
import { getDevicesApi } from '@jellyfin/sdk/lib/utils/api/devices-api';
import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

export const QUERY_KEY = 'Devices';

const fetchDevices = async (
    api: Api,
    requestParams?: DevicesApiGetDevicesRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getDevicesApi(api).getDevices(requestParams, {
        signal: options?.signal
    });

    return response.data;
};

export const useDevices = (requestParams: DevicesApiGetDevicesRequest) => {
    const { api } = useApi();
    return useQuery({
        queryKey: [QUERY_KEY, requestParams],
        queryFn: ({ signal }) => fetchDevices(api!, requestParams, { signal }),
        enabled: !!api
    });
};
