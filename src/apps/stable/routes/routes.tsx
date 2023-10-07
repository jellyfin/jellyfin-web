import { RouteObject, redirect } from 'react-router-dom';
import React from 'react';

import { DASHBOARD_APP_PATHS } from 'apps/dashboard/App';
import ConnectionRequired from 'components/ConnectionRequired';
import { toAsyncPageRouteConfig } from 'components/router/AsyncRoute';
import { toViewManagerPageRouteConfig } from 'components/router/LegacyRoute';
import { toRedirectRouteConfig } from 'components/router/Redirect';
import AppLayout from '../AppLayout';
import { REDIRECTS } from './_redirects';
import { ASYNC_USER_ROUTES } from './asyncRoutes';
import { LEGACY_PUBLIC_ROUTES, LEGACY_USER_ROUTES } from './legacyRoutes';

export const STABLE_APP_ROUTES: RouteObject[] = [
    {
        path: '/*',
        element: <AppLayout />,
        children: [
            {
                /* User routes */
                element: <ConnectionRequired isUserRequired />,
                children: [
                    ...ASYNC_USER_ROUTES.map(toAsyncPageRouteConfig),
                    ...LEGACY_USER_ROUTES.map(toViewManagerPageRouteConfig)
                ]
            },

            /* Public routes */
            { index: true, loader: () => redirect('/home.html') },
            ...LEGACY_PUBLIC_ROUTES.map(toViewManagerPageRouteConfig),

            /* Suppress warnings for unhandled routes */
            { path: '*', element: null }
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
