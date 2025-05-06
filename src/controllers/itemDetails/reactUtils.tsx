import { createRoot } from 'react-dom/client';
import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ApiProvider } from 'hooks/useApi';
import { UserSettingsProvider } from 'hooks/useUserSettings';
import { WebConfigProvider } from 'hooks/useWebConfig';
import { queryClient } from 'utils/query/queryClient';
import { useUserTheme } from 'hooks/useUserTheme';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from 'themes/themes';

export const attachReactElement = (Element: (props: object) => React.ReactNode, props: object, element: HTMLElement) => {
    const domNode = document.createElement('div');
    const root = createRoot(domNode);
    root.render(
        <RootContext>
            <Element {...props} />
        </RootContext>
    );

    element.parentElement?.append(domNode);
};

const RootContext: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { theme } = useUserTheme();
    return (
        <QueryClientProvider client={queryClient}>
            <ApiProvider>
                <UserSettingsProvider>
                    <WebConfigProvider>
                        <ThemeProvider theme={getTheme(theme)}>
                            {children}
                        </ThemeProvider>
                    </WebConfigProvider>
                </UserSettingsProvider>
            </ApiProvider>
        </QueryClientProvider>
    );
};
