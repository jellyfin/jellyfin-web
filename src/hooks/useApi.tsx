import type { Api } from '@jellyfin/sdk';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import type { Event } from 'jellyfin-apiclient';
import React, { type FC, type PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import events from 'utils/events';

export interface JellyfinApiContext {
    api?: Api
    serverId?: string
    user?: UserDto
}

export const ApiContext = createContext<JellyfinApiContext>({});
export const useApi = () => useContext(ApiContext);

export const ApiProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
    const [ api, setApi ] = useState<Api>();
    const [ serverId, setServerId ] = useState<string>();
    const [ user, setUser ] = useState<UserDto>();

    const context = useMemo(() => ({
        api,
        serverId,
        user
    }), [ api, serverId, user ]);

    useEffect(() => {
        ServerConnections.currentApiClient()
            ?.getCurrentUser()
            .then(newUser => updateApiUser(undefined, newUser))
            .catch(err => {
                console.info('[ApiProvider] Could not get current user', err);
            });

        const updateApiUser = (_e: Event | undefined, newUser: UserDto) => {
            setUser(newUser);

            if (newUser.ServerId) {
                setServerId(newUser.ServerId);
            }
        };

        const resetApiUser = () => {
            setServerId(undefined);
            setUser(undefined);
        };

        events.on(ServerConnections, 'localusersignedin', updateApiUser);
        events.on(ServerConnections, 'localusersignedout', resetApiUser);

        return () => {
            events.off(ServerConnections, 'localusersignedin', updateApiUser);
            events.off(ServerConnections, 'localusersignedout', resetApiUser);
        };
    }, [ setServerId, setUser ]);

    useEffect(() => {
        setApi(serverId ? ServerConnections.getApi(serverId) : undefined);
    }, [ serverId, setApi ]);

    return (
        <ApiContext.Provider value={context}>
            {children}
        </ApiContext.Provider>
    );
};
