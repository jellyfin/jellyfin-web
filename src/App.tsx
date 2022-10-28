import { Api } from '@jellyfin/sdk';
import { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { History } from '@remix-run/router';
import { ApiClient, ConnectionManager } from 'jellyfin-apiclient';
import React, { useEffect, useState } from 'react';

import { HistoryRouter } from './components/HistoryRouter';
import ServerConnections from './components/ServerConnections';
import { ApiContext } from './hooks/useApi';
import { UserContext } from './hooks/useUser';
import AppRoutes from './routes/index';
import events from './utils/events';
import { toApi } from './utils/sdk';

interface ServerConnections extends ConnectionManager {
    currentApiClient: () => ApiClient
}

const App = ({ history, connections }: { history: History, connections: ServerConnections }) => {
    const [ api, setApi ] = useState<Api | undefined>(toApi(connections.currentApiClient()));
    const [ user, setUser ] = useState<UserDto | undefined>();

    useEffect(() => {
        connections.currentApiClient()
            .getCurrentUser()
            .then(newUser => setUser(newUser))
            .catch(err => {
                console.warn('[App] Could not get current user', err);
            });

        const udpateApiUser = (_e: any, newUser: UserDto) => {
            setUser(newUser);

            if (newUser.ServerId) {
                setApi(toApi(connections.getApiClient(newUser.ServerId)));
            }
        };

        const resetApiUser = () => {
            setApi(undefined);
            setUser(undefined);
        };

        events.on(connections, 'localusersignedin', udpateApiUser);
        events.on(connections, 'localusersignedout', resetApiUser);

        return () => {
            events.off(connections, 'localusersignedin', udpateApiUser);
            events.off(connections, 'localusersignedout', resetApiUser);
        };
    }, [ connections ]);

    return (
        <ApiContext.Provider value={api}>
            <UserContext.Provider value={user}>
                <HistoryRouter history={history}>
                    <AppRoutes />
                </HistoryRouter>
            </UserContext.Provider>
        </ApiContext.Provider>
    );
};

export default App;
