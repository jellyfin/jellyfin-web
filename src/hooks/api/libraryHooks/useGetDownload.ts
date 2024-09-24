import type { AxiosRequestConfig } from 'axios';
import type { LibraryApiGetDownloadRequest } from '@jellyfin/sdk/lib/generated-client';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getDownload = async (
    apiContext: JellyfinApiContext,
    params: LibraryApiGetDownloadRequest,
    options?: AxiosRequestConfig
) => {
    const { api, user } = apiContext;

    if (!api) throw new Error('[getDownload] No API instance available');
    if (!user?.Id) throw new Error('[getDownload] No User ID provided');

    const response = await getLibraryApi(api).getDownload(params, options);
    return response.data;
};

export const getDownloadQuery = (
    apiContext: JellyfinApiContext,
    params: LibraryApiGetDownloadRequest
) =>
    queryOptions({
        queryKey: ['Download', params.itemId],
        queryFn: ({ signal }) => getDownload(apiContext, params, { signal }),
        enabled: !!apiContext.api && !!apiContext.user?.Id && !!params.itemId
    });

export const useGetDownload = (params: LibraryApiGetDownloadRequest) => {
    const apiContext = useApi();
    return useQuery(getDownloadQuery(apiContext, params));
};
