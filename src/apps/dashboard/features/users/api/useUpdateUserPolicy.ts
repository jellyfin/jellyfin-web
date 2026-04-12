import { UserApiUpdateUserPolicyRequest } from '@jellyfin/sdk/lib/generated-client/api/user-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QUERY_KEY } from './useUser';

export const useUpdateUserPolicy = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: UserApiUpdateUserPolicyRequest) => (

            getUserApi(api!)
                .updateUserPolicy(params)
        ),
        onSuccess: (_, params) => {
            void queryClient.invalidateQueries({
                queryKey: [QUERY_KEY, params.userId]
            });
        }
    });
};
