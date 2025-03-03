import { queryOptions, useQuery } from '@tanstack/react-query';
import type { Api } from '@jellyfin/sdk';
import type { PackageApiGetPackageInfoRequest } from '@jellyfin/sdk/lib/generated-client/api/package-api';
import { getPackageApi } from '@jellyfin/sdk/lib/utils/api/package-api';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

import { QueryKey } from './queryKey';

const fetchPackageInfo = async (
    api: Api,
    params: PackageApiGetPackageInfoRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getPackageApi(api)
        .getPackageInfo(params, options);
    return response.data;
};

const getPackageInfoQuery = (
    api: Api | undefined,
    params?: PackageApiGetPackageInfoRequest
) => queryOptions({
    // Don't retry since requests for plugins not available in repos fail
    retry: false,
    queryKey: [ QueryKey.PackageInfo, params?.name, params?.assemblyGuid ],
    queryFn: ({ signal }) => fetchPackageInfo(api!, params!, { signal }),
    enabled: !!params && !!api && !!params.name
});

export const usePackageInfo = (
    params?: PackageApiGetPackageInfoRequest
) => {
    const { api } = useApi();
    return useQuery(getPackageInfoQuery(api, params));
};
