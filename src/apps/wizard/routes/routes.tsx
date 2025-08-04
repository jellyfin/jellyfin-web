import React from 'react';
import { Navigate, RouteObject } from 'react-router-dom';

import AppLayout from 'apps/stable/AppLayout';
import { AppType } from 'constants/appType';
import ConnectionRequired from 'components/ConnectionRequired';
import ErrorBoundary from 'components/router/ErrorBoundary';
import {
    type LegacyRoute,
    toViewManagerPageRoute
} from 'components/router/LegacyRoute';

const ROUTES: LegacyRoute[] = [
    {
        path: 'remoteaccess',
        pageProps: {
            appType: AppType.Wizard,
            controller: 'remote/index',
            view: 'remote/index.html'
        }
    },
    {
        path: 'finish',
        pageProps: {
            appType: AppType.Wizard,
            controller: 'finish/index',
            view: 'finish/index.html'
        }
    },
    {
        path: 'library',
        pageProps: {
            appType: AppType.Wizard,
            controller: 'library',
            view: 'library.html'
        }
    },
    {
        path: 'settings',
        pageProps: {
            appType: AppType.Wizard,
            controller: 'settings/index',
            view: 'settings/index.html'
        }
    },
    {
        path: 'start',
        pageProps: {
            appType: AppType.Wizard,
            controller: 'start/index',
            view: 'start/index.html'
        }
    },
    {
        path: 'user',
        pageProps: {
            appType: AppType.Wizard,
            controller: 'user/index',
            view: 'user/index.html'
        }
    }
];

export const WIZARD_APP_ROUTES: RouteObject[] = [
    {
        element: <ConnectionRequired level='wizard' />,
        children: [
            {
                Component: AppLayout,
                path: 'wizard',
                children: [
                    { index: true, element: <Navigate replace to='start' /> },
                    ...ROUTES.map(toViewManagerPageRoute)
                ],
                ErrorBoundary
            }
        ]
    }
];
