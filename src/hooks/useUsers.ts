import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk';
import type {
    UserApiGetUsersRequest,
    UserDto
} from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useQuery } from '@tanstack/react-query';

import { useApi } from './useApi';

export type UsersRecords = Record<string, UserDto>;

const fetchUsers = async (
    api: Api,
    requestParams?: UserApiGetUsersRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getUserApi(api).getUsers(requestParams, {
        signal: options?.signal
    });

    return response.data;
};

export const useUsers = (requestParams?: UserApiGetUsersRequest) => {
    const { api } = useApi();
    return useQuery({
        queryKey: ['Users'],
        queryFn: ({ signal }) => fetchUsers(api!, requestParams, { signal }),
        enabled: !!api
    });
};

export const useUsersDetails = () => {
    const { data: users, ...rest } = useUsers();
    const usersById: UsersRecords = {};
    const names: string[] = [];

    if (users) {
        users.forEach((user) => {
            const userId = user.Id;
            if (userId) usersById[userId] = user;
            if (user.Name) names.push(user.Name);
        });
    }

    return {
        users,
        usersById,
        names,
        ...rest
    };
};
