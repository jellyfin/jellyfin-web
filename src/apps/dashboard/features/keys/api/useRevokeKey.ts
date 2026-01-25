import type { ApiKeyApiRevokeKeyRequest } from '@jellyfin/sdk/lib/generated-client';
import { getApiKeyApi } from '@jellyfin/sdk/lib/utils/api/api-key-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QUERY_KEY } from './useApiKeys';

export const useRevokeKey = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: ApiKeyApiRevokeKeyRequest) => getApiKeyApi(api!).revokeKey(params),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QUERY_KEY]
            });
        }
    });
};
