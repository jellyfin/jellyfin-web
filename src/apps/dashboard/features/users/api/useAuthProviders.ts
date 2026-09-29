import { Api } from '@jellyfin/sdk';
import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';
import { getAuthenticationApi } from 'utils/sdk/authentication-api';

const fetchAuthProviders = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getAuthenticationApi(api).getAuthProviders(options);

    return response.data;
};

export const useAuthProviders = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'AuthProviders' ],
        queryFn: ({ signal }) => fetchAuthProviders(api!, { signal }),
        enabled: !!api
    });
};
