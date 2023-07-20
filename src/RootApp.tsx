import loadable from '@loadable/component';
import { History } from '@remix-run/router';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import StableApp from './apps/stable/App';
import { HistoryRouter } from './components/router/HistoryRouter';
import { ApiProvider } from './hooks/useApi';
import { WebConfigProvider } from './hooks/useWebConfig';

const ExperimentalApp = loadable(() => import('./apps/experimental/App'));

const queryClient = new QueryClient();

const RootApp = ({ history }: { history: History }) => {
    const layoutMode = localStorage.getItem('layout');

    return (
        <QueryClientProvider client={queryClient}>
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
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
};

export default RootApp;
