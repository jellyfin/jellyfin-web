import type { UserApiCreateUserByNameRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const createUserByName = async (
    currentApi: JellyfinApiContext,
    parametersOptions: UserApiCreateUserByNameRequest
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getUserApi(api).createUserByName(parametersOptions);
        return response.data;
    }
};

export const useCreateUserByName = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: async (parametersOptions: UserApiCreateUserByNameRequest) =>
            createUserByName(currentApi, parametersOptions)
    });
};
