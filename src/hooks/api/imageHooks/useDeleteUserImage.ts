import type { ImageApiGetUserImageRequest } from '@jellyfin/sdk/lib/generated-client';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const deleteUserImage = async (
    apiContext: JellyfinApiContext,
    params: ImageApiGetUserImageRequest
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[deleteUserImage] No API instance available');

    const response = await getImageApi(api).deleteUserImage(params);
    return response.data;
};

export const useDeleteUserImage = () => {
    const apiContext = useApi();
    return useMutation({
        mutationFn: (params: ImageApiGetUserImageRequest) =>
            deleteUserImage(apiContext, params)
    });
};
