import type { UserApiUpdateUserPasswordRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const updateUserPassword = async (
    apiContext: JellyfinApiContext,
    params: UserApiUpdateUserPasswordRequest
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[updateUserPassword] No API instance available');

    const response = await getUserApi(api).updateUserPassword(params);
    return response.data;
};

export const useUpdateUserPassword = () => {
    const apiContext = useApi();
    return useMutation({
        mutationFn: (params: UserApiUpdateUserPasswordRequest) =>
            updateUserPassword(apiContext, params)
    });
};
