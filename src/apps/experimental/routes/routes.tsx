import React from 'react';
import { RouteObject, redirect } from 'react-router-dom';

import { REDIRECTS } from 'apps/dashboard/routes/_redirects';
import { DASHBOARD_APP_PATHS } from 'apps/dashboard/routes/routes';
import ConnectionRequired from 'components/ConnectionRequired';
import { toAsyncPageRouteConfig } from 'components/router/AsyncRoute';
import { toViewManagerPageRouteConfig } from 'components/router/LegacyRoute';
import { toRedirectRouteConfig } from 'components/router/Redirect';
import AppLayout from '../AppLayout';
import { ASYNC_USER_ROUTES } from './asyncRoutes';
import { LEGACY_PUBLIC_ROUTES, LEGACY_USER_ROUTES } from './legacyRoutes';

export const EXPERIMENTAL_APP_ROUTES: RouteObject[] = [
    {
        path: '/*',
        element: <AppLayout />,
        children: [
            {
                /* User routes: Any child route of this layout is authenticated */
                element: <ConnectionRequired isUserRequired />,
                children: [
                    ...ASYNC_USER_ROUTES.map(toAsyncPageRouteConfig),
                    ...LEGACY_USER_ROUTES.map(toViewManagerPageRouteConfig)
                ]
            },

            /* Public routes */
            { index: true, loader: () => redirect('/home.html') },
            ...LEGACY_PUBLIC_ROUTES.map(toViewManagerPageRouteConfig)
        ]
    },

    /* Redirects for old paths */
    ...REDIRECTS.map(toRedirectRouteConfig),

    /* Ignore dashboard routes */
    ...Object.entries(DASHBOARD_APP_PATHS).map(([, path]) => ({
        path: `/${path}/*`,
        element: null
    }))
];
