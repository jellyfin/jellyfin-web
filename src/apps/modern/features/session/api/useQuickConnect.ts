import type { Api } from '@jellyfin/sdk/lib/api';
import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import { useMutation, useQuery } from '@tanstack/react-query';

import { isTransientQuickConnectError } from '../utils/quickConnectError';

const POLLING_INTERVAL = 5000;
/** How often a state request that may have failed temporarily is retried before the failure is reported */
const MAX_RETRIES = 3;
/** Waits 1s, 2s and 4s before the retries of a failed state request */
const getRetryDelay = (retry: number) => Math.min(1000 * 2 ** retry, POLLING_INTERVAL);

/** Waits for the given time, unless the signal is aborted first. */
const delay = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
    const onAbort = () => {
        clearTimeout(timeout);
        reject(signal.reason instanceof Error ? signal.reason : new Error('The quick connect request was cancelled'));
    };
    const timeout = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
});

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
        // A network blip or a failing proxy should not end the login, so those failures are retried with backoff.
        // Definitive answers (quick connect disabled, unknown secret) are reported right away. The retries are made
        // here rather than with the retry option, which pauses while the tab is hidden, and the tab usually is
        // hidden while the request is approved on another device
        for (let retry = 0; ; retry++) {
            try {
                const { data: state } = await getAuthenticationApi(api).getQuickConnectState({ secret }, { signal });
                return !!state.Authenticated;
            } catch (error) {
                if (signal.aborted || retry >= MAX_RETRIES || !isTransientQuickConnectError(error)) throw error;

                await delay(getRetryDelay(retry), signal);
            }
        }
    },
    // While a request (with its retries) is in flight, the interval does not start a competing one
    refetchInterval: query => (query.state.data ? false : POLLING_INTERVAL),
    refetchIntervalInBackground: true,
    gcTime: 0,
    retry: false,
    meta: {
        // The query key contains the secret, so it must never be persisted
        persist: false,
        // Before signing in, 401 means quick connect is disabled. The error must reach the dialog, instead of being
        // replaced with empty data as for an expired session
        clearOnUnauthorized: false
    }
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
