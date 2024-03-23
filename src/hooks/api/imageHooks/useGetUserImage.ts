import type { AxiosRequestConfig } from 'axios';
import type { ImageApiGetUserImageRequest } from '@jellyfin/sdk/lib/generated-client';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const fetchGetUserImage = async (
    currentApi: JellyfinApiContext,
    parametersOptions: ImageApiGetUserImageRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getImageApi(api).getUserImage(
            {
                ...parametersOptions
            },
            {
                signal: options?.signal
            }
        );
        return response.config.url;
    }
};

export const useGetUserImage = (
    parametersOptions: ImageApiGetUserImageRequest
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: [
            'UserImage',
            {
                ...parametersOptions
            }
        ],
        queryFn: ({ signal }) =>
            fetchGetUserImage(currentApi, parametersOptions, { signal }),
        enabled: !!parametersOptions.tag && !!parametersOptions.userId
    });
};

