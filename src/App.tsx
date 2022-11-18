import { History } from '@remix-run/router';
import React from 'react';

import { HistoryRouter } from './components/HistoryRouter';
import ServerConnections from './components/ServerConnections';
import { ApiProvider } from './hooks/useApi';
import AppRoutes from './routes/index';

const App = ({ history, connections }: { history: History, connections: typeof ServerConnections }) => {
    return (
        <ApiProvider connections={connections}>
            <HistoryRouter history={history}>
                <AppRoutes />
            </HistoryRouter>
        </ApiProvider>
    );
};

export default App;
