import { Api } from '@jellyfin/sdk';
import { getApiKeyApi } from '@jellyfin/sdk/lib/utils/api/api-key-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';

const fetchApiKeys = async (api?: Api) => {
    if (!api) {
        console.error('[useApiKeys] Failed to create Api instance');
        return;
    }

    const response = await getApiKeyApi(api).getKeys();

    return response.data;
};

export const useApiKeys = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'ApiKeys' ],
        queryFn: () => fetchApiKeys(api),
        enabled: !!api
    });
};
