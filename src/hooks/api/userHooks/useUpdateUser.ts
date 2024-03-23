import type { UserApiUpdateUserRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const fetchUpdateUser = async (
    currentApi: JellyfinApiContext,
    parametersOptions: UserApiUpdateUserRequest
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getUserApi(api).updateUser({
            ...parametersOptions
        });
        return response.data;
    }
};

export const useUpdateUser = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: (parametersOptions: UserApiUpdateUserRequest) =>
            fetchUpdateUser(currentApi, parametersOptions)
    });
};
