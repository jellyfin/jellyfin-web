import type { AxiosRequestConfig } from 'axios';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getUserById = async (
    currentApi: JellyfinApiContext,
    userId: string | null | undefined,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api && userId) {
        const response = await getUserApi(api).getUserById(
            {
                userId
            },
            options
        );
        return response.data;
    }
};

export const useGetUserById = (
    userId: string | null | undefined
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['UserById', userId ],
        queryFn: ({ signal }) =>
            getUserById(currentApi, userId, { signal }),
        enabled: !!userId
    });
};
