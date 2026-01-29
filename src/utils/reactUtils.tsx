/**
 * @deprecated Theme wiring is handled via vanilla-extract tokens and data-theme.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'components/themeProvider/ThemeProvider';
import { ApiProvider } from 'hooks/useApi';
import { UserSettingsProvider } from 'hooks/useUserSettings';
import { WebConfigProvider } from 'hooks/useWebConfig';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { logger } from 'utils/logger';
import { queryClient } from 'utils/query/queryClient';

const rootContainer: { current: HTMLElement | null } = { current: null };
const sharedRoot: { current: ReturnType<typeof createRoot> | null } = { current: null };

const getOrCreateRoot = (element: HTMLElement) => {
    if (!rootContainer.current) {
        rootContainer.current = element;
        sharedRoot.current = createRoot(element);
    }
    return sharedRoot.current;
};

export const renderComponent = <P extends object>(
    Component: React.FC<P>,
    props: P,
    element: HTMLElement
) => {
    const root = getOrCreateRoot(element);
    if (!root) {
        logger.error('[reactUtils] Failed to create React root', { component: 'reactUtils' });
        return () => {};
    }

    root.render(
        <RootContext>
            <Component {...props} />
        </RootContext>
    );

    return () => {
        if (element === rootContainer.current && sharedRoot.current) {
            logger.debug('[reactUtils] Keeping shared React root alive', {
                component: 'reactUtils'
            });
        }
    };
};

const RootContext: React.FC<React.PropsWithChildren> = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <ApiProvider>
                <UserSettingsProvider>
                    <WebConfigProvider>
                        <ThemeProvider>{children}</ThemeProvider>
                    </WebConfigProvider>
                </UserSettingsProvider>
            </ApiProvider>
        </QueryClientProvider>
    );
};
