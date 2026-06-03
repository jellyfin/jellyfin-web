import { type SupportedColorScheme, ThemeProvider, useColorScheme } from '@mui/material/styles';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { type FC, type PropsWithChildren, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { ApiProvider } from 'hooks/useApi';
import { UserSettingsProvider } from 'hooks/useUserSettings';
import { useUserTheme } from 'hooks/useUserTheme';
import { WebConfigProvider } from 'hooks/useWebConfig';
import appTheme from 'themes';
import { queryClient } from 'utils/query/queryClient';

/**
 * Render a React component outside of the main React app context
 * i.e. within a legacy view/controller page.
 */
export const renderComponent = <P extends object> (
    Component: FC<P>,
    props: P,
    element: HTMLElement
) => {
    const root = createRoot(element);
    root.render(
        <RootContext>
            <Component {...props} />
        </RootContext>
    );

    // NOTE: We need to wrap the unmount in a setTimeout to workaround this issue with nested roots:
    // https://github.com/facebook/react/issues/25675
    return () => setTimeout(() => root.unmount());
};

/** Component that syncs the MUI theme with our user theme. */
const CustomThemeProvider: FC<PropsWithChildren> = ({ children }) => {
    const { theme } = useUserTheme();
    const { setColorScheme } = useColorScheme();

    useEffect(() => {
        setColorScheme(theme as SupportedColorScheme);
    }, [ theme, setColorScheme ]);

    return (
        // NOTE: Suppress warning about inconsistent return type
        // eslint-disable-next-line react/jsx-no-useless-fragment
        <>
            {children}
        </>
    );
};

/** Component that provides a root context that matches the application root. */
const RootContext: FC<PropsWithChildren> = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <ApiProvider>
                <UserSettingsProvider>
                    <WebConfigProvider>
                        <ThemeProvider
                            theme={appTheme}
                            // Disable color scheme management since we're handling it manually
                            colorSchemeNode={null}
                            storageManager={null}
                            disableStyleSheetGeneration
                        >
                            <CustomThemeProvider>
                                {children}
                            </CustomThemeProvider>
                        </ThemeProvider>
                    </WebConfigProvider>
                </UserSettingsProvider>
            </ApiProvider>
        </QueryClientProvider>
    );
};
