import type { Api } from '@jellyfin/sdk/lib/api';
import type { LibraryApiGetAncestorsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

interface AncestorsParams {
    itemId?: string;
    userId?: string;
}

const fetchAncestors = async (
    api: Api,
    params: LibraryApiGetAncestorsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getLibraryApi(api).getAncestors(params, options);
    return response.data;
};

/** Query options for fetching the hierarchy of ancestors of a given item. */
export const getAncestorsQuery = (
    api?: Api,
    params?: AncestorsParams
) => queryOptions({
    queryKey: [ 'Items', params?.itemId, 'Ancestors' ],
    queryFn: ({ signal }) => fetchAncestors(api!, params as LibraryApiGetAncestorsRequest, { signal }),
    staleTime: Infinity, // Ancestors are unlikely to change
    enabled: !!api && !!params?.itemId
});

/** Hook to fetch the hierarchy of ancestors of a given item. */
export const useAncestors = (
    params: AncestorsParams
) => {
    const apiContext = useApi();
    const { api } = apiContext;
    return useQuery(getAncestorsQuery(api, params));
};
