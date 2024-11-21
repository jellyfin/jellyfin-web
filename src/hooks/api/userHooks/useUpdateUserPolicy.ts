import type { UserApiUpdateUserPolicyRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const updateUserPolicy = async (
    apiContext: JellyfinApiContext,
    params: UserApiUpdateUserPolicyRequest
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[updateUserPolicy] No API instance available');

    const response = await getUserApi(api).updateUserPolicy(params);
    return response.data;
};

export const useUpdateUserPolicy = () => {
    const apiContext = useApi();
    return useMutation({
        mutationFn: (params: UserApiUpdateUserPolicyRequest) =>
            updateUserPolicy(apiContext, params)
    });
};
