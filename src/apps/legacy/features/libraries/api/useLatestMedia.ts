import type { Api } from '@jellyfin/sdk/lib/api';
import type { UserLibraryApiGetLatestMediaRequest } from '@jellyfin/sdk/lib/generated-client/api/user-library-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

const fetchLatestMedia = async (
    api: Api,
    params?: UserLibraryApiGetLatestMediaRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getUserLibraryApi(api)
        .getLatestMedia(params, options);
    return response.data;
};

export const getLatestMediaQuery = (
    api?: Api,
    params?: UserLibraryApiGetLatestMediaRequest
) => queryOptions({
    queryKey: [ 'User', params?.userId, 'LatestMedia', params ],
    queryFn: ({ signal }) => fetchLatestMedia(api!, params, { signal }),
    enabled: !!api
});

export const useLatestMedia = (
    params?: UserLibraryApiGetLatestMediaRequest
) => {
    const { api, user } = useApi();
    return useQuery(getLatestMediaQuery(api, {
        ...params,
        userId: params?.userId || user?.Id
    }));
};
