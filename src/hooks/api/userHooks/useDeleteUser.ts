import type { UserApiDeleteUserRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const deleteUser = async (
    currentApi: JellyfinApiContext,
    parametersOptions: UserApiDeleteUserRequest
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getUserApi(api).deleteUser(parametersOptions);
        return response.data;
    }
};

export const useDeleteUser = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: (parametersOptions: UserApiDeleteUserRequest) =>
            deleteUser(currentApi, parametersOptions)
    });
};
