import type { UserApiCreateUserByNameRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const createUserByName = async (
    apiContext: JellyfinApiContext,
    params: UserApiCreateUserByNameRequest
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[createUserByName] No API instance available');

    const response = await getUserApi(api).createUserByName(params);
    return response.data;
};

export const useCreateUserByName = () => {
    const apiContext = useApi();
    return useMutation({
        mutationFn: (params: UserApiCreateUserByNameRequest) =>
            createUserByName(apiContext, params)
    });
};
