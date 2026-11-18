import type { Api } from '@jellyfin/sdk/lib/api';
import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from '@/hooks/useApi';

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
