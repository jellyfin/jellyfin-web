import type { Api } from '@jellyfin/sdk/lib/api';
import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import { useMutation, useQuery } from '@tanstack/react-query';

const POLLING_INTERVAL = 5000;

export const useInitiateQuickConnect = (api?: Api) => useMutation({
    mutationFn: async () => {
        if (!api) throw new Error('No API instance available');

        const { data } = await getAuthenticationApi(api).initiateQuickConnect();
        if (!data.Secret || !data.Code) {
            throw new Error('Malformed quick connect response');
        }

        return {
            code: data.Code,
            secret: data.Secret
        };
    },
    // Don't keep the secret in the mutation cache
    gcTime: 0
});

/**
 * Polls the state of a quick connect request until it is authorized. Only whether it is authorized is
 * cached, the secret is exchanged for an access token by {@link useAuthenticateWithQuickConnect}.
 */
export const useQuickConnectState = (api: Api, secret: string) => useQuery({
    // Include the server so a request is never polled against a different server
    queryKey: [ 'QuickConnect', 'State', api.basePath, secret ],
    queryFn: async ({ signal }) => {
        const { data: state } = await getAuthenticationApi(api).getQuickConnectState({ secret }, { signal });
        return !!state.Authenticated;
    },
    refetchInterval: query => (query.state.data ? false : POLLING_INTERVAL),
    refetchIntervalInBackground: true,
    gcTime: 0,
    retry: false,
    // The query key contains the secret, so it must never be persisted
    meta: { persist: false }
});

/** Exchanges an authorized quick connect secret for an authentication result. */
export const useAuthenticateWithQuickConnect = (api: Api) => useMutation({
    mutationFn: async (secret: string) => {
        const { data } = await getAuthenticationApi(api).authenticateWithQuickConnect({
            quickConnectDto: {
                Secret: secret
            }
        });
        return data;
    },
    // Don't keep the secret and access token in the mutation cache
    gcTime: 0
});
