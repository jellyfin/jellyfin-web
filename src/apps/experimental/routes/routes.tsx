import React from 'react';
import { RouteObject, redirect } from 'react-router-dom';

import { REDIRECTS } from 'apps/dashboard/routes/_redirects';
import ConnectionRequired from 'components/ConnectionRequired';
import { toAsyncPageRoute } from 'components/router/AsyncRoute';
import { toViewManagerPageRoute } from 'components/router/LegacyRoute';
import { toRedirectRoute } from 'components/router/Redirect';
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
                    ...ASYNC_USER_ROUTES.map(toAsyncPageRoute),
                    ...LEGACY_USER_ROUTES.map(toViewManagerPageRoute)
                ]
            },

            /* Public routes */
            { index: true, loader: () => redirect('/home.html') },
            ...LEGACY_PUBLIC_ROUTES.map(toViewManagerPageRoute)
        ]
    },

    /* Redirects for old paths */
    ...REDIRECTS.map(toRedirectRoute)
];
