import type { AxiosRequestConfig } from 'axios';
import type { ImageApiGetUserImageRequest } from '@jellyfin/sdk/lib/generated-client';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getUserImage = async (
    apiContext: JellyfinApiContext,
    params: ImageApiGetUserImageRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[getUserImage] No API instance available');

    const response = await getImageApi(api).getUserImage(params, options);
    return response.config.url;
};

export const getUserImageQuery = (
    apiContext: JellyfinApiContext,
    params: ImageApiGetUserImageRequest
) =>
    queryOptions({
        queryKey: ['UserImage', params],
        queryFn: ({ signal }) => getUserImage(apiContext, params, { signal }),
        enabled: !!apiContext.api && !!params.tag && !!params.userId
    });

export const useGetUserImage = (params: ImageApiGetUserImageRequest) => {
    const apiContext = useApi();
    return useQuery(getUserImageQuery(apiContext, params));
};
