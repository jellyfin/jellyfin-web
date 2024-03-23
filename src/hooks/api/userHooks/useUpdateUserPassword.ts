import type { UserApiUpdateUserPasswordRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const fetchUpdateUserPassword = async (
    currentApi: JellyfinApiContext,
    parametersOptions: UserApiUpdateUserPasswordRequest
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getUserApi(api).updateUserPassword({
            ...parametersOptions
        });
        return response.data;
    }
};

export const useUpdateUserPassword = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: (parametersOptions: UserApiUpdateUserPasswordRequest) =>
            fetchUpdateUserPassword(currentApi, parametersOptions)
    });
};
