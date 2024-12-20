import { Api } from '@jellyfin/sdk';
import { LibraryApiGetMediaFoldersRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';

const fetchLibraryMediaFolders = async (api?: Api, params?: LibraryApiGetMediaFoldersRequest) => {
    if (!api) {
        console.error('[useLibraryMediaFolders] no Api instance available');
        return;
    }

    const response = await getLibraryApi(api).getMediaFolders(params);

    return response.data;
};

export const useLibraryMediaFolders = (params?: LibraryApiGetMediaFoldersRequest) => {
    const { api } = useApi();

    return useQuery({
        queryKey: ['LibraryMediaFolders'],
        queryFn: () => fetchLibraryMediaFolders(api, params),
        enabled: !!api
    });
};
