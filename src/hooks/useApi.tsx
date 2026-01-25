import { useEffect } from 'react';

import { useApiStore, useApi } from '../store/apiStore';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import events from 'utils/events';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';

// Re-export for compatibility
export { useApi };
export type { JellyfinApiContext } from '../store/apiStore';

export const ApiProvider = ({ children }: { children: React.ReactNode }) => {
    const { setLegacyApiClient, setApi, setUser } = useApiStore();

    useEffect(() => {
        ServerConnections.currentApiClient()
            ?.getCurrentUser()
            .then(newUser => updateApiUser(undefined, newUser))
            .catch(err => {
                console.info('[ApiProvider] Could not get current user', err);
            });

        const updateApiUser = (_e: any, newUser: UserDto) => {
            setUser(newUser);

            if (newUser.ServerId) {
                const client = ServerConnections.getApiClient(newUser.ServerId);
                setLegacyApiClient(client);
                setApi(toApi(client));
            }
        };

        const resetApiUser = () => {
            setLegacyApiClient(undefined);
            setApi(undefined);
            setUser(undefined);
        };

        events.on(ServerConnections as any, 'localusersignedin', updateApiUser);
        events.on(ServerConnections as any, 'localusersignedout', resetApiUser);

        return () => {
            events.off(ServerConnections as any, 'localusersignedin', updateApiUser);
            events.off(ServerConnections as any, 'localusersignedout', resetApiUser);
        };
    }, [setLegacyApiClient, setApi, setUser]);

    return <>{children}</>;
};
