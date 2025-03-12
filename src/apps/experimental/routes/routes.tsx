import React from 'react';
import { Navigate, RouteObject } from 'react-router-dom';

import ConnectionRequired from 'components/ConnectionRequired';
import { toAsyncPageRoute } from 'components/router/AsyncRoute';
import { toViewManagerPageRoute } from 'components/router/LegacyRoute';
import ErrorBoundary from 'components/router/ErrorBoundary';
import FallbackRoute from 'components/router/FallbackRoute';

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
            ...LEGACY_PUBLIC_ROUTES.map(toViewManagerPageRoute),

            /* Fallback route for invalid paths */
            {
                path: '*',
                Component: FallbackRoute
            }
        ]
    }
];
