import { Api } from '@jellyfin/sdk';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';

const fetchPasswordResetProviders = async (api?: Api) => {
    if (!api) {
        console.error('[useAuthProvider] No Api instance available');
        return;
    }

    const response = await getSessionApi(api).getPasswordResetProviders();

    return response.data;
};

export const usePasswordResetProviders = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'PasswordResetProviders' ],
        queryFn: () => fetchPasswordResetProviders(api),
        enabled: !!api
    });
};
