import { Api } from '@jellyfin/sdk';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';

const fetchAuthProviders = async (api?: Api) => {
    if (!api) {
        console.error('[useAuthProvider] No Api instance available');
        return;
    }

    const response = await getSessionApi(api).getAuthProviders();

    return response.data;
};

export const useAuthProviders = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'AuthProviders' ],
        queryFn: () => fetchAuthProviders(api),
        enabled: !!api
    });
};
