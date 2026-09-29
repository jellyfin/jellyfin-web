import { Api } from '@jellyfin/sdk';
import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import { useQuery } from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';

export const QUERY_KEY = 'ApiKeys';

const fetchApiKeys = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getAuthenticationApi(api).getKeys(options);

    return response.data;
};

export const useApiKeys = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ QUERY_KEY ],
        queryFn: ({ signal }) => fetchApiKeys(api!, { signal }),
        enabled: !!api
    });
};
