import { History } from '@remix-run/router';
import React from 'react';

import AppHeader from './components/AppHeader';
import Backdrop from './components/Backdrop';
import { HistoryRouter } from './components/HistoryRouter';
import { ApiProvider } from './hooks/useApi';
import { AppRoutes, ExperimentalAppRoutes } from './routes';

const App = ({ history }: { history: History }) => {
    const layoutMode = localStorage.getItem('layout');

    return (
        <ApiProvider>
            <HistoryRouter history={history}>
                <Backdrop />
                <AppHeader />

                <div className='mainAnimatedPages skinBody' />
                <div className='skinBody'>
                    {layoutMode === 'experimental' ? <ExperimentalAppRoutes /> : <AppRoutes /> }
                </div>
            </HistoryRouter>
        </ApiProvider>
    );
};

export default App;
