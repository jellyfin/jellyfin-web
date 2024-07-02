import type { AxiosRequestConfig } from 'axios';
import type { UserApiGetUsersRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getUsers = async (
    currentApi: JellyfinApiContext,
    parametersOptions: UserApiGetUsersRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getUserApi(api).getUsers(
            parametersOptions,
            options
        );
        return response.data;
    }
};

export const useGetUsers = (parametersOptions: UserApiGetUsersRequest) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['Users'],
        queryFn: ({ signal }) =>
            getUsers(currentApi, parametersOptions, { signal })
    });
};
