import loadable from '@loadable/component';
import { History } from '@remix-run/router';
import React from 'react';

import StableApp from './apps/stable/App';
import { HistoryRouter } from './components/HistoryRouter';
import { ApiProvider } from './hooks/useApi';

const ExperimentalApp = loadable(() => import('./apps/experimental/App'));

const RootApp = ({ history }: { history: History }) => {
    const layoutMode = localStorage.getItem('layout');

    return (
        <ApiProvider>
            <HistoryRouter history={history}>
                {
                    layoutMode === 'experimental' ?
                        <ExperimentalApp /> :
                        <StableApp />
                }
            </HistoryRouter>
        </ApiProvider>
    );
};

export default RootApp;
