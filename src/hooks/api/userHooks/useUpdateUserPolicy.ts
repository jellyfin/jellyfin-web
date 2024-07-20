import type { UserApiUpdateUserPolicyRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const updateUserPolicy = async (
    currentApi: JellyfinApiContext,
    parametersOptions: UserApiUpdateUserPolicyRequest
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getUserApi(api).updateUserPolicy(parametersOptions);

        return response.data;
    }
};

export const useUpdateUserPolicy = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: (parametersOptions: UserApiUpdateUserPolicyRequest) =>
            updateUserPolicy(currentApi, parametersOptions)
    });
};
