import type { UserApiUpdateUserRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const updateUser = async (
    apiContext: JellyfinApiContext,
    params: UserApiUpdateUserRequest
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[updateUser] No API instance available');

    const response = await getUserApi(api).updateUser(params);
    return response.data;
};

export const useUpdateUser = () => {
    const apiContext = useApi();
    return useMutation({
        mutationFn: (params: UserApiUpdateUserRequest) =>
            updateUser(apiContext, params)
    });
};
