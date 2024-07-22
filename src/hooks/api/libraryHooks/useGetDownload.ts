import type { Api } from '@jellyfin/sdk';
import type { AxiosRequestConfig } from 'axios';
import type { LibraryApiGetDownloadRequest } from '@jellyfin/sdk/lib/generated-client';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';

const getDownload = async (
    api: Api | undefined,
    requestParameters: LibraryApiGetDownloadRequest,
    options?: AxiosRequestConfig
) => {
    if (!api) throw new Error('No API instance available');

    const response = await getLibraryApi(api).getDownload(requestParameters, options);
    return response.data;
};

export const getDownloadQuery = (
    api: Api | undefined,
    requestParameters: LibraryApiGetDownloadRequest
) =>
    queryOptions({
        queryKey: ['Download', requestParameters],
        queryFn: ({ signal }) => getDownload(api, requestParameters, { signal }),
        enabled: !!api
    });

export const useGetDownload = (requestParameters: LibraryApiGetDownloadRequest) => {
    const { api } = useApi();
    return useQuery(getDownloadQuery(api, requestParameters));
};
