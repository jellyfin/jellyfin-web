import type { AxiosRequestConfig } from 'axios';
import type { DevicesApiGetDevicesRequest } from '@jellyfin/sdk/lib/generated-client';
import { getDevicesApi } from '@jellyfin/sdk/lib/utils/api/devices-api';
import { useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const fetchGetDevices = async (
    currentApi: JellyfinApiContext,
    parametersOptions: DevicesApiGetDevicesRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getDevicesApi(api).getDevices(
            {
                ...parametersOptions
            },
            {
                signal: options?.signal
            }
        );
        return response.data.Items || [];
    }
};

export const useGetDevices = (
    parametersOptions: DevicesApiGetDevicesRequest
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: [
            'Devices',
            {
                ...parametersOptions
            }
        ],
        queryFn: ({ signal }) =>
            fetchGetDevices(currentApi, parametersOptions, { signal }),
        enabled: !!parametersOptions.userId
    });
};
