import { ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { ApiProvider } from 'hooks/useApi';
import { UserSettingsProvider } from 'hooks/useUserSettings';
import { WebConfigProvider } from 'hooks/useWebConfig';
import appTheme from 'themes/themes';
import { queryClient } from 'utils/query/queryClient';

export const renderComponent = <P extends object> (
    Component: React.FC<P>,
    props: P,
    element: HTMLElement
) => {
    createRoot(element)
        .render(
            <RootContext>
                <Component {...props} />
            </RootContext>
        );
};

const RootContext: React.FC<React.PropsWithChildren> = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <ApiProvider>
                <UserSettingsProvider>
                    <WebConfigProvider>
                        <ThemeProvider theme={appTheme} defaultMode='dark'>
                            {children}
                        </ThemeProvider>
                    </WebConfigProvider>
                </UserSettingsProvider>
            </ApiProvider>
        </QueryClientProvider>
    );
};
