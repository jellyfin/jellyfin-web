import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk/lib/api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { queryOptions, useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi';

export const QUERY_KEY = 'PublicUsers';

const fetchUsers = async (
    api: Api,
    options?: AxiosRequestConfig
) => {
    const response = await getUserApi(api).getPublicUsers(options);
    return response.data;
};

export const getPublicUsersQuery = (
    api?: Api
) => {
    return queryOptions({
        queryKey: [ QUERY_KEY ],
        queryFn: ({ signal }) => fetchUsers(api!, { signal }),
        enabled: !!api
    });
};

export const usePublicUsers = () => {
    const { api } = useApi();
    return useQuery(getPublicUsersQuery(api));
};
