import type { AxiosRequestConfig } from 'axios';
import type { ImageApiPostUserImageRequest } from '@jellyfin/sdk/lib/generated-client';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const postUserImage = async (
    apiContext: JellyfinApiContext,
    params: ImageApiPostUserImageRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[postUserImage] No API instance available');

    const response = await getImageApi(api).postUserImage(params, options);
    return response.data;
};

export const usePostUserImage = () => {
    const apiContext = useApi();
    return useMutation({
        mutationFn: ({
            params,
            options
        }: {
            params: ImageApiPostUserImageRequest;
            options?: AxiosRequestConfig;
        }) => postUserImage(apiContext, params, options)
    });
};
