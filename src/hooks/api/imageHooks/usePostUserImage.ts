import type { ImageApiPostUserImageRequest } from '@jellyfin/sdk/lib/generated-client';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const postUserImage = async (
    currentApi: JellyfinApiContext,
    parametersOptions: ImageApiPostUserImageRequest
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getImageApi(api).postUserImage({
            ...parametersOptions
        });
        return response.data;
    }
};

export const usePostUserImage = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: (parametersOptions: ImageApiPostUserImageRequest) =>
            postUserImage(currentApi, parametersOptions)
    });
};
