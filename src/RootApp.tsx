import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

import { ThemeProvider } from 'components/themeProvider/ThemeProvider';
import { ApiProvider } from 'hooks/useApi';
import { UserSettingsProvider } from 'hooks/useUserSettings';
import { WebConfigProvider } from 'hooks/useWebConfig';
import RootAppRouter from 'RootAppRouter';
import browser from 'scripts/browser';
import { queryClient } from 'utils/query/queryClient';

import { LoadingOverlay } from './components/feedback';
import { OSDOverlay } from './components/playback';

import './components/visualizer/visualizers.scss';

const useReactQueryDevtools =
    typeof window.Proxy !== 'undefined' // '@tanstack/query-devtools' requires 'Proxy', which cannot be polyfilled for legacy browsers
    && !browser.tv; // Don't use devtools on the TV as the navigation is weird

function RootApp(): React.ReactElement {
    return (
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
}

export default RootApp;
