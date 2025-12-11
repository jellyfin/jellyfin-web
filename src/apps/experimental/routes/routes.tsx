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
            { index: true, element: <Navigate replace to='/home' /> },

            {
                /* User routes */
                Component: ConnectionRequired,
                children: [
                    ...ASYNC_USER_ROUTES.map(toAsyncPageRoute),
                    ...LEGACY_USER_ROUTES.map(toViewManagerPageRoute),

                    // The video page is special since it combines new controls with the legacy view
                    {
                        path: 'video',
                        Component: VideoPage
                    }
                ],
                ErrorBoundary
            },

            {
                /* Public routes */
                element: <ConnectionRequired level='public' />,
                children: [
                    ...LEGACY_PUBLIC_ROUTES.map(toViewManagerPageRoute),

                    /* Fallback route for invalid paths */
                    {
                        path: '*',
                        Component: FallbackRoute
                    }
                ]
            }

        ]
    }
];
