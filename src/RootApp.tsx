import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import React from 'react';

import QueryClientEventHandler from 'components/QueryClientEventHandler';
import { ApiProvider } from 'hooks/useApi';
import { UserSettingsProvider } from 'hooks/useUserSettings';
import { WebConfigProvider } from 'hooks/useWebConfig';
import browser from 'scripts/browser';
import { persister, queryClient } from 'utils/query/queryClient';

import RootAppRouter from 'RootAppRouter';

const hasValidBrowserLanguageTag = (() => {
    const legacyNavigator = navigator as Navigator & { userLanguage?: string };
    const locale = legacyNavigator.language || legacyNavigator.userLanguage;
    if (!locale) {
        return true;
    }

    if (typeof Intl === 'object' && Intl && typeof Intl.getCanonicalLocales === 'function') {
        try {
            Intl.getCanonicalLocales(locale);
            return true;
        } catch {
            console.warn('[RootApp] Invalid browser locale for React Query Devtools. Disabling devtools.', locale);
            return false;
        }
    }

    return true;
})();

const useReactQueryDevtools = window.Proxy // '@tanstack/query-devtools' requires 'Proxy', which cannot be polyfilled for legacy browsers
    && !browser.tv // Don't use devtools on the TV as the navigation is weird
    && hasValidBrowserLanguageTag;

const ReactQueryDevtools = React.lazy(() => import('@tanstack/react-query-devtools')
    .then(module => ({ default: module.ReactQueryDevtools }))
    .catch((err) => {
        console.warn('[RootApp] Failed to load React Query Devtools. Disabling devtools for this session.', err);
        return { default: () => null };
    }));

const RootApp = () => (
    <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
            buster: __JF_BUILD_VERSION__,
            persister
        }}
    >
        <ApiProvider>
            <UserSettingsProvider>
                <WebConfigProvider>
                    <QueryClientEventHandler />
                    <RootAppRouter />
                </WebConfigProvider>
            </UserSettingsProvider>
        </ApiProvider>
        {useReactQueryDevtools && (
            <React.Suspense fallback={null}>
                <ReactQueryDevtools initialIsOpen={false} />
            </React.Suspense>
        )}
    </PersistQueryClientProvider>
);

export default RootApp;
