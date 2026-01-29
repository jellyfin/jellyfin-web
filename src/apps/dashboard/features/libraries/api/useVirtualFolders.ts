import { type Api } from '@jellyfin/sdk';
import { getLibraryStructureApi } from '@jellyfin/sdk/lib/utils/api/library-structure-api';
import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';

const fetchVirtualFolders = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getLibraryStructureApi(api).getVirtualFolders(options);

    return response.data;
};

export const useVirtualFolders = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: ['VirtualFolders'],
        queryFn: ({ signal }) => fetchVirtualFolders(api!, { signal }),
        enabled: !!api
    });
};
