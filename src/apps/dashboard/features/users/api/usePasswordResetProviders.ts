import { Api } from '@jellyfin/sdk';
import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';
import { getAuthenticationApi } from 'utils/sdk/authentication-api';

const fetchPasswordResetProviders = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getAuthenticationApi(api).getPasswordResetProviders(options);

    return response.data;
};

export const usePasswordResetProviders = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'PasswordResetProviders' ],
        queryFn: ({ signal }) => fetchPasswordResetProviders(api!, { signal }),
        enabled: !!api
    });
};
