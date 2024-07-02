import type { AxiosRequestConfig } from 'axios';
import type { ImageApiPostUserImageRequest } from '@jellyfin/sdk/lib/generated-client';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const postUserImage = async (
    currentApi: JellyfinApiContext,
    requestParameters: ImageApiPostUserImageRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getImageApi(api).postUserImage(requestParameters, options);
        return response.data;
    }
};

export const usePostUserImage = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: ({ requestParameters, options }: {requestParameters: ImageApiPostUserImageRequest, options?: AxiosRequestConfig}) =>
            postUserImage(currentApi, requestParameters, options)
    });
};
