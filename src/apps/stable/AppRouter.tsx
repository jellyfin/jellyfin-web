import { History } from '@remix-run/router';
import React from 'react';
import { Outlet, RouterProvider, createHashRouter, useLocation } from 'react-router-dom';

import { useLegacyRouterSync } from 'hooks/useLegacyRouterSync';
import { STABLE_APP_ROUTES } from './routes/routes';
import Backdrop from 'components/Backdrop';
import AppHeader from 'components/AppHeader';
import { DASHBOARD_APP_PATHS, DASHBOARD_APP_ROUTES } from 'apps/dashboard/routes/routes';

const router = createHashRouter([{
    element: <StableAppLayout />,
    children: [
        ...STABLE_APP_ROUTES,
        ...DASHBOARD_APP_ROUTES
    ]
}]);

export default function StableAppRouter({ history }: Readonly<{ history: History }>) {
    useLegacyRouterSync({ router, history });

    return <RouterProvider router={router} />;
}

/**
 * Layout component that renders legacy components required on all pages.
 * NOTE: The app will crash if these get removed from the DOM.
 */
function StableAppLayout() {
    const location = useLocation();
    const isNewLayoutPath = Object.values(DASHBOARD_APP_PATHS)
        .some(path => location.pathname.startsWith(`/${path}`));

    return (
        <>
            <Backdrop />
            <AppHeader isHidden={isNewLayoutPath} />

            <Outlet />
        </>
    );
}
