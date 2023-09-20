import loadable from '@loadable/component';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import ConnectionRequired from 'components/ConnectionRequired';
import { toViewManagerPageRoute } from 'components/router/LegacyRoute';
import { AsyncPageProps, AsyncRoute, toAsyncPageRoute } from 'components/router/AsyncRoute';
import { toRedirectRoute } from 'components/router/Redirect';
import ServerContentPage from 'components/ServerContentPage';

import { REDIRECTS } from './routes/_redirects';
import { ASYNC_ADMIN_ROUTES } from './routes/_asyncRoutes';
import { LEGACY_ADMIN_ROUTES } from './routes/_legacyRoutes';
import AppLayout from './AppLayout';

const DashboardAsyncPage = loadable(
    (props: { page: string }) => import(/* webpackChunkName: "[request]" */ `./routes/${props.page}`),
    { cacheKey: (props: AsyncPageProps) => props.page }
);

const toDashboardAsyncPageRoute = (route: AsyncRoute) => (
    toAsyncPageRoute({
        ...route,
        element: DashboardAsyncPage
    })
);

const DashboardApp = () => (
    <Routes>
        <Route element={<ConnectionRequired isAdminRequired />}>
            <Route element={<AppLayout />}>
                <Route path='dashboard'>
                    {ASYNC_ADMIN_ROUTES.map(toDashboardAsyncPageRoute)}
                    {LEGACY_ADMIN_ROUTES.map(toViewManagerPageRoute)}
                </Route>

                {/* TODO: Should the metadata manager be a separate app? */}
                {toViewManagerPageRoute({
                    path: 'metadata',
                    pageProps: {
                        controller: 'edititemmetadata',
                        view: 'edititemmetadata.html'
                    }
                })}

                <Route path='configurationpage' element={
                    <ServerContentPage view='/web/configurationpage' />
                } />

                {/* Suppress warnings for unhandled routes */}
                <Route path='*' element={null} />
            </Route>
        </Route>

        {/* Redirects for old paths */}
        {REDIRECTS.map(toRedirectRoute)}
    </Routes>
);

export default DashboardApp;
