import { AuthenticationApiCreateKeyRequest } from '@jellyfin/sdk/lib/generated-client/api/authentication-api';
import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QUERY_KEY } from './useApiKeys';

export const useCreateKey = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: AuthenticationApiCreateKeyRequest) => (
            getAuthenticationApi(api!)
                .createKey(params)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QUERY_KEY ]
            });
        }
    });
};
