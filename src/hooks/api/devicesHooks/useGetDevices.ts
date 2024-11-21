import type { AxiosRequestConfig } from 'axios';
import type { DevicesApiGetDevicesRequest } from '@jellyfin/sdk/lib/generated-client';
import { getDevicesApi } from '@jellyfin/sdk/lib/utils/api/devices-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getDevices = async (
    apiContext: JellyfinApiContext,
    params: DevicesApiGetDevicesRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[getDevices] No API instance available');

    const response = await getDevicesApi(api).getDevices(params, options);
    return response.data.Items || [];
};

export const getDevicesQuery = (
    apiContext: JellyfinApiContext,
    params: DevicesApiGetDevicesRequest
) =>
    queryOptions({
        queryKey: ['Devices', params],
        queryFn: ({ signal }) => getDevices(apiContext, params, { signal }),
        enabled: !!apiContext.api && !!params.userId
    });

export const useGetDevices = (params: DevicesApiGetDevicesRequest) => {
    const apiContext = useApi();
    return useQuery(getDevicesQuery(apiContext, params));
};
