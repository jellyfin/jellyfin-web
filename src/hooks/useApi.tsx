import type { Api } from '@jellyfin/sdk';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import type { ApiClient, Event } from 'jellyfin-apiclient';
import React, { createContext, FC, useContext, useEffect, useState } from 'react';

import type ServerConnections from '../components/ServerConnections';
import events from '../utils/events';
import { toApi } from '../utils/jellyfin-apiclient/compat';

interface ApiProviderProps {
    connections: typeof ServerConnections
}

interface JellyfinApiContext {
    __legacyApiClient__?: ApiClient
    api?: Api
    user?: UserDto
}

export const ApiContext = createContext<JellyfinApiContext>({});
export const useApi = () => useContext(ApiContext);

export const ApiProvider: FC<ApiProviderProps> = ({ connections, children }) => {
    const [ legacyApiClient, setLegacyApiClient ] = useState<ApiClient>();
    const [ api, setApi ] = useState<Api>();
    const [ user, setUser ] = useState<UserDto>();

    useEffect(() => {
        connections.currentApiClient()
            .getCurrentUser()
            .then(newUser => updateApiUser(undefined, newUser))
            .catch(err => {
                console.info('[ApiProvider] Could not get current user', err);
            });

        const updateApiUser = (_e: Event | undefined, newUser: UserDto) => {
            setUser(newUser);

            if (newUser.ServerId) {
                setLegacyApiClient(connections.getApiClient(newUser.ServerId));
            }
        };

        const resetApiUser = () => {
            setLegacyApiClient(undefined);
            setUser(undefined);
        };

        events.on(connections, 'localusersignedin', updateApiUser);
        events.on(connections, 'localusersignedout', resetApiUser);

        return () => {
            events.off(connections, 'localusersignedin', updateApiUser);
            events.off(connections, 'localusersignedout', resetApiUser);
        };
    }, [ connections, setLegacyApiClient, setUser ]);

    useEffect(() => {
        setApi(legacyApiClient ? toApi(legacyApiClient) : undefined);
    }, [ legacyApiClient, setApi ]);

    return (
        <ApiContext.Provider value={{
            __legacyApiClient__: legacyApiClient,
            api,
            user
        }}>
            {children}
        </ApiContext.Provider>
    );
};
