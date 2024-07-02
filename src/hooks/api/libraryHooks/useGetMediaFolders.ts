import type { AxiosRequestConfig } from 'axios';
import type { LibraryApiGetMediaFoldersRequest } from '@jellyfin/sdk/lib/generated-client';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getMediaFolders = async (
    currentApi: JellyfinApiContext,
    parametersOptions: LibraryApiGetMediaFoldersRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getLibraryApi(api).getMediaFolders(parametersOptions, options );
        return response.data.Items || [];
    }
};

export const useGetMediaFolders = (
    parametersOptions: LibraryApiGetMediaFoldersRequest
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['MediaFolders', parametersOptions.isHidden],
        queryFn: ({ signal }) =>
            getMediaFolders(currentApi, parametersOptions, { signal })
    });
};
