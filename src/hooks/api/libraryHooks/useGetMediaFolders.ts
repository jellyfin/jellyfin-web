import type { AxiosRequestConfig } from 'axios';
import type { LibraryApiGetMediaFoldersRequest } from '@jellyfin/sdk/lib/generated-client';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getMediaFolders = async (
    apiContext: JellyfinApiContext,
    params: LibraryApiGetMediaFoldersRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[getMediaFolders] No API instance available');

    const response = await getLibraryApi(api).getMediaFolders(params, options);
    return response.data.Items || [];
};

export const getMediaFoldersQuery = (
    apiContext: JellyfinApiContext,
    params: LibraryApiGetMediaFoldersRequest
) =>
    queryOptions({
        queryKey: ['MediaFolders', params.isHidden],
        queryFn: ({ signal }) =>
            getMediaFolders(apiContext, params, { signal }),
        enabled: !!apiContext.api
    });

export const useGetMediaFolders = (
    params: LibraryApiGetMediaFoldersRequest
) => {
    const apiContext = useApi();
    return useQuery(getMediaFoldersQuery(apiContext, params));
};
