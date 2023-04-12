import { History } from '@remix-run/router';
import React from 'react';

import { HistoryRouter } from './components/HistoryRouter';
import { ApiProvider } from './hooks/useApi';
import { AppRoutes, ExperimentalAppRoutes } from './routes';

const App = ({ history }: { history: History }) => {
    const layoutMode = localStorage.getItem('layout');
    return (
        <ApiProvider>
            <HistoryRouter history={history}>
                {layoutMode === 'experimental' ? <ExperimentalAppRoutes /> : <AppRoutes /> }
            </HistoryRouter>
        </ApiProvider>
    );
};

export default App;
