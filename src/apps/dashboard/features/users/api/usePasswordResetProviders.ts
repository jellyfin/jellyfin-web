import { Api } from '@jellyfin/sdk';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import type { AxiosRequestConfig } from 'axios';

const fetchPasswordResetProviders = async (api?: Api, options?: AxiosRequestConfig) => {
    if (!api) {
        console.error('[useAuthProvider] No Api instance available');
        return;
    }

    const response = await getSessionApi(api).getPasswordResetProviders(options);

    return response.data;
};

export const usePasswordResetProviders = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'PasswordResetProviders' ],
        queryFn: ({ signal }) => fetchPasswordResetProviders(api, { signal }),
        enabled: !!api
    });
};
