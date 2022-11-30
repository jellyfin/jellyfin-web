import { History } from '@remix-run/router';
import React from 'react';

import { HistoryRouter } from './components/HistoryRouter';
import { ApiProvider } from './hooks/useApi';
import AppRoutes from './routes/index';

const App = ({ history }: { history: History }) => {
    return (
        <ApiProvider>
            <HistoryRouter history={history}>
                <AppRoutes />
            </HistoryRouter>
        </ApiProvider>
    );
};

export default App;
