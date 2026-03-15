import React from 'react';
import { Navigate, RouteObject } from 'react-router-dom';

import AppLayout from 'apps/stable/AppLayout';
import { AppType } from 'constants/appType';
import ConnectionRequired from 'components/ConnectionRequired';
import ErrorBoundary from 'components/router/ErrorBoundary';
import { AsyncRoute, toAsyncPageRoute } from 'components/router/AsyncRoute';

const ROUTES: AsyncRoute[] = [
    { path: 'start', type: AppType.Wizard },
    { path: 'user', type: AppType.Wizard },
    { path: 'library', type: AppType.Wizard },
    { path: 'settings', type: AppType.Wizard },
    { path: 'remote', type: AppType.Wizard },
    { path: 'finish', type: AppType.Wizard }
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
                    ...ROUTES.map(toAsyncPageRoute)
                ],
                ErrorBoundary
            }
        ]
    }
];
