import type { AxiosRequestConfig } from 'axios';
import type { UserApiGetUsersRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getUsers = async (
    apiContext: JellyfinApiContext,
    params: UserApiGetUsersRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[getUsers] No API instance available');

    const response = await getUserApi(api).getUsers(params, options);
    return response.data;
};

export const getUsersQuery = (
    apiContext: JellyfinApiContext,
    params: UserApiGetUsersRequest
) =>
    queryOptions({
        queryKey: ['Users'],
        queryFn: ({ signal }) => getUsers(apiContext, params, { signal }),
        enabled: !!apiContext.api
    });

export const useGetUsers = (params: UserApiGetUsersRequest) => {
    const apiContext = useApi();
    return useQuery(getUsersQuery(apiContext, params));
};
