import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { useEffect } from 'react';
import events from 'utils/events';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import { logger } from 'utils/logger';
import { useApi, useApiStore } from '../store/apiStore';

// Re-export for compatibility
export { useApi };
export type { JellyfinApiContext } from '../store/apiStore';

export const ApiProvider = ({ children }: { children: React.ReactNode }) => {
    const { setLegacyApiClient, setApi, setUser } = useApiStore();

    useEffect(() => {
        ServerConnections.currentApiClient()
            ?.getCurrentUser()
            .then((newUser) => updateApiUser(undefined, newUser))
            .catch((err) => {
                logger.info('[ApiProvider] Could not get current user', {
                    err,
                    component: 'ApiProvider'
                });
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
