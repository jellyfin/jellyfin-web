import loadable from '@loadable/component';
import { ThemeProvider } from '@mui/material/styles';
import { History } from '@remix-run/router';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import AppHeader from 'components/AppHeader';
import Backdrop from 'components/Backdrop';
import { HistoryRouter } from 'components/router/HistoryRouter';
import { ApiProvider } from 'hooks/useApi';
import { WebConfigProvider } from 'hooks/useWebConfig';
import theme from 'themes/theme';

const DashboardApp = loadable(() => import('./apps/dashboard/App'));
const ExperimentalApp = loadable(() => import('./apps/experimental/App'));
const StableApp = loadable(() => import('./apps/stable/App'));

const queryClient = new QueryClient();

const RootAppLayout = () => {
    const layoutMode = localStorage.getItem('layout');
    const isExperimentalLayout = layoutMode === 'experimental';

    return (
        <>
            <Backdrop />
            <AppHeader isHidden={isExperimentalLayout} />

            {
                isExperimentalLayout ?
                    <ExperimentalApp /> :
                    <StableApp />
            }

            <DashboardApp />
        </>
    );
};

const RootApp = ({ history }: { history: History }) => (
    <QueryClientProvider client={queryClient}>
        <ApiProvider>
            <WebConfigProvider>
                <ThemeProvider theme={theme}>
                    <HistoryRouter history={history}>
                        <RootAppLayout />
                    </HistoryRouter>
                </ThemeProvider>
            </WebConfigProvider>
        </ApiProvider>
        <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
);

export default RootApp;
