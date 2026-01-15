import { Api } from '@jellyfin/sdk';
import { LibraryApiGetMediaFoldersRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import type { AxiosRequestConfig } from 'axios';

const fetchLibraryMediaFolders = async (api: Api, params?: LibraryApiGetMediaFoldersRequest, options?: AxiosRequestConfig) => {
    const response = await getLibraryApi(api).getMediaFolders(params, options);

    return response.data;
};

export const useLibraryMediaFolders = (params?: LibraryApiGetMediaFoldersRequest) => {
    const { api } = useApi();

    return useQuery({
        queryKey: ['LibraryMediaFolders'],
        queryFn: ({ signal }) => fetchLibraryMediaFolders(api!, params, { signal }),
        enabled: !!api
    });
};
