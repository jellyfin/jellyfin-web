import type { VideosApiDeleteAlternateSourcesRequest } from '@jellyfin/sdk/lib/generated-client';
import { getVideosApi } from '@jellyfin/sdk/lib/utils/api/videos-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const deleteAlternateSources = async (
    currentApi: JellyfinApiContext,
    requestParameters: VideosApiDeleteAlternateSourcesRequest
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getVideosApi(api).deleteAlternateSources(requestParameters);
        return response.data;
    }
};

export const useDeleteAlternateSources = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: (requestParameters: VideosApiDeleteAlternateSourcesRequest) =>
            deleteAlternateSources(currentApi, requestParameters)
    });
};
