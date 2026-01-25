import { type Api } from '@jellyfin/sdk';
import { getApiKeyApi } from '@jellyfin/sdk/lib/utils/api/api-key-api';
import { useQuery } from '@tanstack/react-query';
import { type AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';

export const QUERY_KEY = 'ApiKeys';

const fetchApiKeys = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getApiKeyApi(api).getKeys(options);

    return response.data;
};

export const useApiKeys = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: ({ signal }) => fetchApiKeys(api!, { signal }),
        enabled: !!api
    });
};
