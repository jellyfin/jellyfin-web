import type { AxiosRequestConfig } from 'axios';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';
import type { NullableString } from 'types/base/common/shared/types';

const getUserById = async (
    apiContext: JellyfinApiContext,
    userId: NullableString,
    options?: AxiosRequestConfig
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[getUserById] No API instance available');
    if (!userId) throw new Error('[getUserById] No User ID provided');

    const response = await getUserApi(api).getUserById({ userId }, options);
    return response.data;
};

export const getUserByIdQuery = (
    apiContext: JellyfinApiContext,
    userId: NullableString
) =>
    queryOptions({
        queryKey: ['UserById', userId],
        queryFn: ({ signal }) => getUserById(apiContext, userId, { signal }),
        enabled: !!apiContext.api && !!userId,
        staleTime: Infinity
    });

export const useGetUserById = (userId: NullableString) => {
    const apiContext = useApi();
    return useQuery(getUserByIdQuery(apiContext, userId));
};
