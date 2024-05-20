import loadable from '@loadable/component';
import { ThemeProvider } from '@mui/material/styles';
import { History } from '@remix-run/router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

import { ApiProvider } from 'hooks/useApi';
import { WebConfigProvider } from 'hooks/useWebConfig';
import theme from 'themes/theme';
import { queryClient } from 'utils/query/queryClient';
import './components/visualizer/visualizers.scss';

const StableAppRouter = loadable(() => import('./apps/stable/AppRouter'));
const RootAppRouter = loadable(() => import('./RootAppRouter'));

const RootApp = ({ history }: Readonly<{ history: History }>) => {
    const layoutMode = localStorage.getItem('layout');
    const isExperimentalLayout = layoutMode === 'experimental';

    return (
        <QueryClientProvider client={queryClient}>
            <ApiProvider>
                <WebConfigProvider>
                    <ThemeProvider theme={theme}>
                        {isExperimentalLayout ?
                            <RootAppRouter history={history} /> :
                            <StableAppRouter history={history} />
                        }
                    </ThemeProvider>
                </WebConfigProvider>
            </ApiProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
};

export default RootApp;
