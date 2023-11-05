import { History } from '@remix-run/router';
import React from 'react';
import { RouterProvider, createHashRouter } from 'react-router-dom';

import { DASHBOARD_APP_ROUTES } from 'apps/dashboard/routes/routes';
import { useLegacyRouterSync } from 'hooks/useLegacyRouterSync';
import { STABLE_APP_ROUTES } from './routes/routes';

const router = createHashRouter([
    ...STABLE_APP_ROUTES,
    ...DASHBOARD_APP_ROUTES
]);

export default function StableAppRouter({ history }: Readonly<{ history: History }>) {
    useLegacyRouterSync({ router, history });

    return <RouterProvider router={router} />;
}
