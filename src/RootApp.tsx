import loadable from '@loadable/component';
import { History } from '@remix-run/router';
import React from 'react';

import StableApp from './apps/stable/App';
import { HistoryRouter } from './components/router/HistoryRouter';
import { ApiProvider } from './hooks/useApi';
import { WebConfigProvider } from './hooks/useWebConfig';

const ExperimentalApp = loadable(() => import('./apps/experimental/App'));

const RootApp = ({ history }: { history: History }) => {
    const layoutMode = localStorage.getItem('layout');

    return (
        <ApiProvider>
            <WebConfigProvider>
                <HistoryRouter history={history}>
                    {
                        layoutMode === 'experimental' ?
                            <ExperimentalApp /> :
                            <StableApp />
                    }
                </HistoryRouter>
            </WebConfigProvider>
        </ApiProvider>
    );
};

export default RootApp;
