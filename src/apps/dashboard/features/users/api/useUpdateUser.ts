import { UserApiUpdateUserRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QUERY_KEY } from './useUser';

export const useUpdateUser = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: UserApiUpdateUserRequest) => (
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            getUserApi(api!)
                .updateUser(params)
        ),
        onSuccess: (_, params) => {
            void queryClient.invalidateQueries({
                queryKey: [QUERY_KEY, params.userId]
            });
        }
    });
};
