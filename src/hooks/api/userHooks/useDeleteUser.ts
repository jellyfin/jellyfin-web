import type { UserApiDeleteUserRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const deleteUser = async (
    apiContext: JellyfinApiContext,
    params: UserApiDeleteUserRequest
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[deleteUser] No API instance available');

    const response = await getUserApi(api).deleteUser(params);
    return response.data;
};

export const useDeleteUser = () => {
    const apiContext = useApi();
    return useMutation({
        mutationFn: (params: UserApiDeleteUserRequest) =>
            deleteUser(apiContext, params)
    });
};
