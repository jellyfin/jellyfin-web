import { type UserApiDeleteUserRequest } from '@jellyfin/sdk/lib/generated-client/api/user-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { QUERY_KEY } from 'hooks/useUsers';
import { queryClient } from 'utils/query/queryClient';

export const useDeleteUser = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: UserApiDeleteUserRequest) => (
            getUserApi(api!)
                .deleteUser(params)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QUERY_KEY ]
            });
        }
    });
};
