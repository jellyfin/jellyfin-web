import { type ApiKeyApiCreateKeyRequest } from '@jellyfin/sdk/lib/generated-client/api/api-key-api';
import { getApiKeyApi } from '@jellyfin/sdk/lib/utils/api/api-key-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QUERY_KEY } from './useApiKeys';

export const useCreateKey = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: ApiKeyApiCreateKeyRequest) => (
            getApiKeyApi(api!)
                .createKey(params)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QUERY_KEY ]
            });
        }
    });
};
