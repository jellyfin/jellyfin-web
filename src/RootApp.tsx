import { History } from '@remix-run/router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

import { ApiProvider } from 'hooks/useApi';
import { WebConfigProvider } from 'hooks/useWebConfig';
import { queryClient } from 'utils/query/queryClient';

import RootAppRouter from 'RootAppRouter';

const RootApp = ({ history }: Readonly<{ history: History }>) => (
    <QueryClientProvider client={queryClient}>
        <ApiProvider>
            <WebConfigProvider>
                <RootAppRouter history={history} />
            </WebConfigProvider>
        </ApiProvider>
        <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
);

export default RootApp;
