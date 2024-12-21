import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk';
import type { UserApiGetUsersRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useQuery } from '@tanstack/react-query';

import { useApi } from './useApi';

const fetchUsers = async (
    api?: Api,
    requestParams?: UserApiGetUsersRequest,
    options?: AxiosRequestConfig
) => {
    if (!api) {
        console.warn('[fetchUsers] No API instance available');
        return;
    }

    const response = await getUserApi(api).getUsers(requestParams, {
        signal: options?.signal
    });

    return response.data;
};

export const useUsers = (requestParams?: UserApiGetUsersRequest) => {
    const { api } = useApi();
    return useQuery({
        queryKey: ['Users'],
        queryFn: ({ signal }) =>
            fetchUsers(api, requestParams, { signal }),
        enabled: !!api
    });
};
