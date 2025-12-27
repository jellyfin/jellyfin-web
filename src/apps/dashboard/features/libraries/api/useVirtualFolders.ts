import { Api } from '@jellyfin/sdk';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import type { AxiosRequestConfig } from 'axios';
import { getLibraryStructureApi } from '@jellyfin/sdk/lib/utils/api/library-structure-api';

const fetchVirtualFolders = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getLibraryStructureApi(api).getVirtualFolders(options);

    return response.data;
};

export const useVirtualFolders = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'VirtualFolders' ],
        queryFn: ({ signal }) => fetchVirtualFolders(api!, { signal }),
        enabled: !!api
    });
};
