/**
 * TanStack Router - Primary Router for Jellyfin Web
 *
 * This file uses TanStack Router as the main router for the application.
 * The stable app routes are fully migrated to TanStack Router.
 * Dashboard and other routes still use React Router for now.
 */

import React, { lazy, Suspense, useEffect } from 'react';
import { Outlet, RouterProvider, useLocation } from '@tanstack/react-router';

import { DASHBOARD_APP_PATHS } from 'apps/dashboard/routes/routes';
import { LayoutMode } from 'constants/layoutMode';
import AppHeader from 'components/AppHeader';
import Backdrop from 'components/Backdrop';
import { setAppHistory } from 'components/router/appHistory';
import { createRouterHistory } from 'components/router/routerHistory';
import { ThemeProvider } from 'components/themeProvider/ThemeProvider';
import loading from 'components/loading/loading';
import browser from 'scripts/browser';

import { router } from './router';
import { setRouter } from './components/router/appRouter';

const Visualizers = lazy(() => import('components/visualizer/Visualizers'));

const LAYOUT_SETTING_KEY = 'layout';

const layoutMode = browser.tv ? LayoutMode.Tv : localStorage.getItem(LAYOUT_SETTING_KEY);
const isExperimentalLayout = layoutMode == null || layoutMode === '' || layoutMode === LayoutMode.Experimental;

// Set the router for appRouter compatibility
setRouter(router);

export const history = createRouterHistory(router);
setAppHistory(history);

export function RootAppRouter(): React.ReactElement {
    useEffect(() => {
        loading.hide();
    }, []);

    return <RouterProvider router={router} />;
}

export default RootAppRouter;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RootAppLayout() {
    const location = useLocation();
    const isNewLayoutPath = Object.values(DASHBOARD_APP_PATHS).some(path => location.pathname.startsWith(`/${path}`));

    return (
        <ThemeProvider>
            <Suspense fallback={null}>
                <Visualizers />
            </Suspense>
            <Backdrop />
            <AppHeader isHidden={isExperimentalLayout || isNewLayoutPath} />

            <Outlet />
        </ThemeProvider>
    );
}
