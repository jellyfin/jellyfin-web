import loadable from '@loadable/component';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import ConnectionRequired from 'components/ConnectionRequired';
import { toViewManagerPageRoute } from 'components/router/LegacyRoute';
import { AsyncPageProps, AsyncRoute, toAsyncPageRoute } from 'components/router/AsyncRoute';
import { toRedirectRoute } from 'components/router/Redirect';
import ServerContentPage from 'components/ServerContentPage';

import AppLayout from './AppLayout';
import { REDIRECTS } from './routes/_redirects';
import { ASYNC_ADMIN_ROUTES } from './routes/_asyncRoutes';
import { LEGACY_ADMIN_ROUTES } from './routes/_legacyRoutes';

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

export const DASHBOARD_APP_PATHS = {
    Dashboard: 'dashboard',
    MetadataManager: 'metadata',
    PluginConfig: 'configurationpage'
};

const DashboardApp = () => (
    <Routes>
        <Route element={<ConnectionRequired isAdminRequired />}>
            <Route element={<AppLayout drawerlessPaths={[ DASHBOARD_APP_PATHS.MetadataManager ]} />}>
                <Route path={DASHBOARD_APP_PATHS.Dashboard}>
                    {ASYNC_ADMIN_ROUTES.map(toDashboardAsyncPageRoute)}
                    {LEGACY_ADMIN_ROUTES.map(toViewManagerPageRoute)}
                </Route>

                {/* NOTE: The metadata editor might deserve a dedicated app in the future */}
                {toViewManagerPageRoute({
                    path: DASHBOARD_APP_PATHS.MetadataManager,
                    pageProps: {
                        controller: 'edititemmetadata',
                        view: 'edititemmetadata.html'
                    }
                })}

                <Route path={DASHBOARD_APP_PATHS.PluginConfig} element={
                    <ServerContentPage view='/web/configurationpage' />
                } />
            </Route>
        </Route>

        {/* Suppress warnings for unhandled routes */}
        <Route path='*' element={null} />

        {/* Redirects for old paths */}
        {REDIRECTS.map(toRedirectRoute)}
    </Routes>
);

export default DashboardApp;
