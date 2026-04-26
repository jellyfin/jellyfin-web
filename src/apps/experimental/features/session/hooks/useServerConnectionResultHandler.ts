import { useCallback } from 'react';
import { ConnectionState } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import Dashboard from 'utils/dashboard';

export function useServerConnectionResultHandler () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleResult = useCallback((result: any) => {
        async function handleResultAsync() {
            if (result.State === ConnectionState.SignedIn) {
                const apiClient = result.ApiClient;

                Dashboard.onServerChanged(apiClient.getCurrentUserId(), apiClient.accessToken(), apiClient);
                await Dashboard.navigate('home');
            }

            if (result.State === ConnectionState.ServerSignIn) {
                const path = result.SystemInfo.StartupWizardCompleted ?
                    `login?serverid=${result.Servers[0].Id}` :
                    '/wizard/start';

                await Dashboard.navigate(path, false);
            }

            if (result.State === ConnectionState.ServerSelection) {
                await Dashboard.navigate('selectserver', false);
            }

            if (result.State === ConnectionState.ServerUpdateNeeded) {
                Dashboard.alert({
                    message: globalize.translate('ServerUpdateNeeded', '<a href="https://github.com/jellyfin/jellyfin">https://github.com/jellyfin/jellyfin</a>')
                });
            }

            if (result.State === ConnectionState.Unavailable) {
                Dashboard.alert({
                    message: globalize.translate('MessageUnableToConnectToServer'),
                    title: globalize.translate('HeaderConnectionFailure')
                });
            }
        }

        handleResultAsync().catch(err => {
            console.log('[useServerConnectionResultHandler] Failed while handling result', err);
        });
    }, []);

    return handleResult;
}
