
import { History } from '@remix-run/router';
import React from 'react';
import {
    RouterProvider,
    createHashRouter,
    Outlet
} from 'react-router-dom';

import { EXPERIMENTAL_APP_ROUTES } from 'apps/experimental/routes/routes';
import AppHeader from 'components/AppHeader';
import Backdrop from 'components/Backdrop';
import { useLegacyRouterSync } from 'hooks/useLegacyRouterSync';
import { DASHBOARD_APP_ROUTES } from 'apps/dashboard/routes/routes';
import UserThemeProvider from 'themes/UserThemeProvider';
import { STABLE_APP_ROUTES } from 'apps/stable/routes/routes';
import Visualizers from 'components/visualizer/Visualizers';

const layoutMode = localStorage.getItem('layout');
const isExperimentalLayout = layoutMode === 'experimental';

const router = createHashRouter([
    {
        element: <RootAppLayout />,
        children: [
            ...EXPERIMENTAL_APP_ROUTES,
            ...DASHBOARD_APP_ROUTES
        ]
    }
]);

export default function RootAppRouter({ history }: Readonly<{ history: History }>) {
    useLegacyRouterSync({ router, history });

    return <RouterProvider router={router} />;
}

/**
 * Layout component that renders legacy components required on all pages.
 * NOTE: The app will crash if these get removed from the DOM.
 */
function RootAppLayout() {
    return (
        <UserThemeProvider>
            <Visualizers />
            <Backdrop />
            <AppHeader isHidden />

            <Outlet />
        </>
    );
}
