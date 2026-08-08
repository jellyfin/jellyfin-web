import type { DeviceApiGetDevicesRequest } from '@jellyfin/sdk/lib/generated-client/api/device-api';
import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk';
import { getDeviceApi } from '@jellyfin/sdk/lib/utils/api/device-api';
import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';

export const QUERY_KEY = 'Devices';

const fetchDevices = async (
    api: Api,
    requestParams?: DeviceApiGetDevicesRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getDeviceApi(api).getDevices(requestParams, {
        signal: options?.signal
    });

    return response.data;
};

export const useDevices = (
    requestParams: DeviceApiGetDevicesRequest
) => {
    const { api } = useApi();
    return useQuery({
        queryKey: [QUERY_KEY, requestParams],
        queryFn: ({ signal }) =>
            fetchDevices(api!, requestParams, { signal }),
        enabled: !!api,
        staleTime: 0 // ensure we load the latest device data
    });
};
