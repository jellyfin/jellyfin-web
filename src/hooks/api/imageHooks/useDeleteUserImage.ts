import type { ImageApiGetUserImageRequest } from '@jellyfin/sdk/lib/generated-client';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const deleteUserImage = async (
    currentApi: JellyfinApiContext,
    parametersOptions: ImageApiGetUserImageRequest
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getImageApi(api).deleteUserImage(parametersOptions);
        return response.data;
    }
};

export const useDeleteUserImage = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: (parametersOptions: ImageApiGetUserImageRequest) =>
            deleteUserImage(currentApi, parametersOptions)
    });
};
