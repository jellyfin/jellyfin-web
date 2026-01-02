import type { Api } from '@jellyfin/sdk';
import { getPackageApi } from '@jellyfin/sdk/lib/utils/api/package-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from '@/hooks/useApi';

import { QueryKey } from './queryKey';

const fetchPackages = async (
    api: Api,
    options?: AxiosRequestConfig
) => {
    const response = await getPackageApi(api)
        .getPackages(options);
    return response.data;
};

const getPackagesQuery = (
    api?: Api
) => queryOptions({
    queryKey: [ QueryKey.Packages ],
    queryFn: ({ signal }) => fetchPackages(api!, { signal }),
    enabled: !!api,
    staleTime: 15 * 60 * 1000 // 15 minutes
});

export const usePackages = () => {
    const { api } = useApi();
    return useQuery(getPackagesQuery(api));
};

