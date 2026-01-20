import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

import { ApiProvider } from 'hooks/useApi';
import { UserSettingsProvider } from 'hooks/useUserSettings';
import { WebConfigProvider } from 'hooks/useWebConfig';
import browser from 'scripts/browser';
import { queryClient } from 'utils/query/queryClient';
import { JoyThemeProvider } from 'themes/joyTheme';
import { OSDOverlay } from './components/joy-ui/playback';

import './components/visualizer/visualizers.scss';

import RootAppRouter from 'RootAppRouter';

const useReactQueryDevtools = typeof window.Proxy !== 'undefined' // '@tanstack/query-devtools' requires 'Proxy', which cannot be polyfilled for legacy browsers
    && !browser.tv; // Don't use devtools on the TV as the navigation is weird

const RootApp = () => (
    <QueryClientProvider client={queryClient}>
        <ApiProvider>
            <UserSettingsProvider>
                <WebConfigProvider>
                    <JoyThemeProvider>
                        <RootAppRouter />
                        <OSDOverlay />
                    </JoyThemeProvider>
                </WebConfigProvider>
            </UserSettingsProvider>
        </ApiProvider>
        {useReactQueryDevtools && (
            <ReactQueryDevtools initialIsOpen={false} />
        )}
    </QueryClientProvider>
);

export default RootApp;
