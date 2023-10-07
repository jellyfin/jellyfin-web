import loadable from '@loadable/component';
import { ThemeProvider } from '@mui/material/styles';
import { History } from '@remix-run/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

import { DASHBOARD_APP_PATHS } from 'apps/dashboard/App';
import AppHeader from 'components/AppHeader';
import Backdrop from 'components/Backdrop';
import { ApiProvider } from 'hooks/useApi';
import { WebConfigProvider } from 'hooks/useWebConfig';
import theme from 'themes/theme';
import { HistoryRouter } from 'components/router/HistoryRouter';

const DashboardApp = loadable(() => import('./apps/dashboard/App'));
const StableAppRouter = loadable(() => import('./apps/stable/AppRouter'));
const RootAppRouter = loadable(() => import('./RootAppRouter'));

const queryClient = new QueryClient();

const RootAppLayout = ({ history }: { history: History }) => {
    const layoutMode = localStorage.getItem('layout');
    const isExperimentalLayout = layoutMode === 'experimental';

    const isNewLayoutPath = Object.values(DASHBOARD_APP_PATHS)
        .some(path => window.location.pathname.startsWith(`/${path}`));

    return (
        <>
            <Backdrop />
            <AppHeader isHidden={isExperimentalLayout || isNewLayoutPath} />

            {isExperimentalLayout ?
                <RootAppRouter history={history} /> :
                <StableAppRouter history={history} />
            }

            <HistoryRouter history={history}>
                <DashboardApp />
            </HistoryRouter>
        </>
    );
};

const RootApp = ({ history }: { history: History }) => (
    <QueryClientProvider client={queryClient}>
        <ApiProvider>
            <WebConfigProvider>
                <ThemeProvider theme={theme}>
                    <RootAppLayout history={history} />
                </ThemeProvider>
            </WebConfigProvider>
        </ApiProvider>
        <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
);

export default RootApp;
