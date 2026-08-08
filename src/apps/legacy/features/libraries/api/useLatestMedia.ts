import type { Api } from '@jellyfin/sdk/lib/api';
import type { LibraryApiGetLatestMediaRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

const fetchLatestMedia = async (
    api: Api,
    params?: LibraryApiGetLatestMediaRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getLibraryApi(api)
        .getLatestMedia(params, options);
    return response.data;
};

export const getLatestMediaQuery = (
    api?: Api,
    params?: LibraryApiGetLatestMediaRequest
) => queryOptions({
    queryKey: [ 'User', params?.userId, 'LatestMedia', params ],
    queryFn: ({ signal }) => fetchLatestMedia(api!, params, { signal }),
    enabled: !!api
});

export const useLatestMedia = (
    params?: LibraryApiGetLatestMediaRequest
) => {
    const { api, user } = useApi();
    return useQuery(getLatestMediaQuery(api, {
        ...params,
        userId: params?.userId || user?.Id
    }));
};
