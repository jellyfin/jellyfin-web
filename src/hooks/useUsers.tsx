import type { AxiosRequestConfig } from 'axios';
import type { UserApiGetUsersRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useQuery } from '@tanstack/react-query';

import { type JellyfinApiContext, useApi } from './useApi';

export const fetchGetUsers = async (
    currentApi: JellyfinApiContext,
    requestParams?: UserApiGetUsersRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;

    if (!api) return;

    const response = await getUserApi(api).getUsers(requestParams, {
        signal: options?.signal
    });

    return response.data;
};

export const useUsers = (requestParams?: UserApiGetUsersRequest) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['Users'],
        queryFn: ({ signal }) =>
            fetchGetUsers(currentApi, requestParams, { signal })
    });
};
