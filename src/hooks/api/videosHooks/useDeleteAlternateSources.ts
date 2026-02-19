import type { VideosApiDeleteAlternateSourcesRequest } from '@jellyfin/sdk/lib/generated-client';
import { getVideosApi } from '@jellyfin/sdk/lib/utils/api/videos-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const deleteAlternateSources = async (
    apiContext: JellyfinApiContext,
    params: VideosApiDeleteAlternateSourcesRequest
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[deleteAlternateSources] No API instance available');

    const response = await getVideosApi(api).deleteAlternateSources(params);
    return response.data;
};

export const useDeleteAlternateSources = () => {
    const apiContext = useApi();
    return useMutation({
        mutationFn: (params: VideosApiDeleteAlternateSourcesRequest) =>
            deleteAlternateSources(apiContext, params)
    });
};
