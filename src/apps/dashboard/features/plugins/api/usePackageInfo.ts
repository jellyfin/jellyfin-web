import { queryOptions, useQuery } from '@tanstack/react-query';
import type { Api } from '@jellyfin/sdk';
import type { PluginApiGetPackageInfoRequest } from '@jellyfin/sdk/lib/generated-client/api/plugin-api';
import { getPluginApi } from '@jellyfin/sdk/lib/utils/api/plugin-api';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

import { QueryKey } from './queryKey';
import { queryClient } from 'utils/query/queryClient';
import { getPackagesQuery } from './usePackages';

const fetchPackageInfo = async (
    api: Api,
    params: PluginApiGetPackageInfoRequest,
    options?: AxiosRequestConfig
) => {
    if (params.assemblyGuid) {
        const packages = await queryClient.fetchQuery(getPackagesQuery(api));
        const pkg = packages.find(v => v.guid === params.assemblyGuid);

        if (pkg) {
            return pkg;
        }
    }

    const response = await getPluginApi(api)
        .getPackageInfo(params, options);
    return response.data;
};

const getPackageInfoQuery = (
    api: Api | undefined,
    params?: PluginApiGetPackageInfoRequest
) => queryOptions({
    // Don't retry since requests for plugins not available in repos fail
    retry: false,
    queryKey: [ QueryKey.Packages, params?.name, params?.assemblyGuid ],
    queryFn: ({ signal }) => fetchPackageInfo(api!, params!, { signal }),
    enabled: !!params && !!api && !!params.name
});

export const usePackageInfo = (
    params?: PluginApiGetPackageInfoRequest
) => {
    const { api } = useApi();
    return useQuery(getPackageInfoQuery(api, params));
};
