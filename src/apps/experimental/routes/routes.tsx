import React from 'react';
import { Navigate, RouteObject } from 'react-router-dom';

import { REDIRECTS } from 'apps/dashboard/routes/_redirects';
import ConnectionRequired from 'components/ConnectionRequired';
import { toAsyncPageRoute } from 'components/router/AsyncRoute';
import BangRedirect from 'components/router/BangRedirect';
import { toViewManagerPageRoute } from 'components/router/LegacyRoute';
import { toRedirectRoute } from 'components/router/Redirect';
import ErrorBoundary from 'components/router/ErrorBoundary';

import { ASYNC_USER_ROUTES } from './asyncRoutes';
import { LEGACY_PUBLIC_ROUTES, LEGACY_USER_ROUTES } from './legacyRoutes';
import VideoPage from './video';

export const EXPERIMENTAL_APP_ROUTES: RouteObject[] = [
    {
        path: '/*',
        lazy: () => import('../AppLayout'),
        children: [
            {
                /* User routes: Any child route of this layout is authenticated */
                element: <ConnectionRequired isUserRequired />,
                children: [
                    ...ASYNC_USER_ROUTES.map(toAsyncPageRoute),
                    ...LEGACY_USER_ROUTES.map(toViewManagerPageRoute),

                    // The video page is special since it combines new controls with the legacy view
                    {
                        path: 'video',
                        element: <VideoPage />
                    }
                ],
                ErrorBoundary
            },

            /* Public routes */
            { index: true, element: <Navigate replace to='/home.html' /> },
            ...LEGACY_PUBLIC_ROUTES.map(toViewManagerPageRoute)
        ]
    },

    {
        path: '!/*',
        Component: BangRedirect
    },

    /* Redirects for old paths */
    ...REDIRECTS.map(toRedirectRoute)
];
