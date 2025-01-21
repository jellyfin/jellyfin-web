import { UserApiCreateUserByNameRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';

export const useCreateUser = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: UserApiCreateUserByNameRequest) => (
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            getUserApi(api!)
                .createUserByName(params)
        )
    });
};
