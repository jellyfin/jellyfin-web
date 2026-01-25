import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { ApiProvider } from 'hooks/useApi';
import { UserSettingsProvider } from 'hooks/useUserSettings';
import { WebConfigProvider } from 'hooks/useWebConfig';
import { ThemeProvider } from 'components/themeProvider/ThemeProvider';
import { queryClient } from 'utils/query/queryClient';
import browser from 'scripts/browser';

import { OSDOverlay } from './components/joy-ui/playback';
import { LoadingOverlay } from './components/joy-ui/feedback';
import RootAppRouter from 'RootAppRouter';

import './components/visualizer/visualizers.scss';

const useReactQueryDevtools =
    typeof window.Proxy !== 'undefined' && // '@tanstack/query-devtools' requires 'Proxy', which cannot be polyfilled for legacy browsers
    !browser.tv; // Don't use devtools on the TV as the navigation is weird

const RootApp = (): React.ReactElement => (
    <QueryClientProvider client={queryClient}>
        <ApiProvider>
            <UserSettingsProvider>
                <WebConfigProvider>
                    <ThemeProvider>
                        <RootAppRouter />
                        <OSDOverlay />
                        <LoadingOverlay />
                    </ThemeProvider>
                </WebConfigProvider>
            </UserSettingsProvider>
        </ApiProvider>
        {useReactQueryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
);

export default RootApp;
