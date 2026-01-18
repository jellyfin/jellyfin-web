import React from 'react';
import { Navigate, RouteObject } from 'react-router-dom';

import ConnectionRequired from 'components/ConnectionRequired';
import { ASYNC_ADMIN_ROUTES } from './_asyncRoutes';
import { toAsyncPageRoute } from 'components/router/AsyncRoute';
import { toViewManagerPageRoute } from 'components/router/LegacyRoute';
import { LEGACY_ADMIN_ROUTES } from './_legacyRoutes';
import ServerContentPage from 'components/ServerContentPage';
import ErrorBoundary from 'components/router/ErrorBoundary';

export const DASHBOARD_APP_PATHS = {
    Dashboard: 'dashboard',
    MetadataManager: 'metadata',
    PluginConfig: 'configurationpage'
};

export const DASHBOARD_APP_ROUTES: RouteObject[] = [
    {
        element: <ConnectionRequired level='admin' />,
        children: [
            {
                lazy: () => import('../AppLayout'),
                children: [
                    {
                        path: DASHBOARD_APP_PATHS.Dashboard,
                        children: [
                            ...ASYNC_ADMIN_ROUTES.map(toAsyncPageRoute),
                            ...LEGACY_ADMIN_ROUTES.map(toViewManagerPageRoute),
                            {
                                path: 'plugins/catalog',
                                element: <Navigate replace to='/dashboard/plugins' />
                            }
                        ],
                        errorElement: <ErrorBoundary />
                    },

                    /* NOTE: The metadata editor might deserve a dedicated app in the future */
                    toViewManagerPageRoute({
                        path: DASHBOARD_APP_PATHS.MetadataManager,
                        pageProps: {
                            controller: 'edititemmetadata',
                            view: 'edititemmetadata.html'
                        }
                    }),

                    {
                        path: DASHBOARD_APP_PATHS.PluginConfig,
                        element: <ServerContentPage view='/web/configurationpage' />
                    }
                ]
            }
        ]
    }
];
