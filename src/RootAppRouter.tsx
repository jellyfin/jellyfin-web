import { ThemeProvider } from '@mui/material/styles';
import React, { lazy, Suspense } from 'react';
import {
    RouterProvider,
    createHashRouter,
    Outlet,
    useLocation
} from 'react-router-dom';

import { DASHBOARD_APP_PATHS, DASHBOARD_APP_ROUTES } from 'apps/dashboard/routes/routes';
import { EXPERIMENTAL_APP_ROUTES } from 'apps/experimental/routes/routes';
import { STABLE_APP_ROUTES } from 'apps/stable/routes/routes';
import { WIZARD_APP_ROUTES } from 'apps/wizard/routes/routes';
import AppHeader from 'components/AppHeader';
import Backdrop from 'components/Backdrop';
import { SETTING_KEY as LAYOUT_SETTING_KEY } from 'components/layoutManager';
import BangRedirect from 'components/router/BangRedirect';
import { setAppHistory } from 'components/router/appHistory';
import { createRouterHistory } from 'components/router/routerHistory';
import { LayoutMode } from 'constants/layoutMode';
import browser from 'scripts/browser';
import appTheme from 'themes';
import { ThemeStorageManager } from 'themes/themeStorageManager';

// Lazy load heavy components
const Visualizers = lazy(() => import('components/visualizer/Visualizers'));

const layoutMode = browser.tv ? LayoutMode.Tv : localStorage.getItem(LAYOUT_SETTING_KEY);
const isExperimentalLayout = layoutMode == null || layoutMode === '' || layoutMode === LayoutMode.Experimental;

const router = createHashRouter([
    {
        element: <RootAppLayout />,
        children: [
            ...(isExperimentalLayout ? EXPERIMENTAL_APP_ROUTES : STABLE_APP_ROUTES),
            ...DASHBOARD_APP_ROUTES,
            ...WIZARD_APP_ROUTES,
            {
                path: '!/*',
                Component: BangRedirect
            }
        ]
    }
], {
    future: {
        v7_startTransition: true
    }
} as Parameters<typeof createHashRouter>[1]);

export const history = createRouterHistory(router);
setAppHistory(history);

export function RootAppRouter() {
    return <RouterProvider router={router} />;
}

// Keep default export for backward compatibility
export default RootAppRouter;

/**
 * Layout component that renders legacy components required on all pages.
 * NOTE: The app will crash if these get removed from the DOM.
 */
function RootAppLayout() {
    const location = useLocation();
    const isNewLayoutPath = Object.values(DASHBOARD_APP_PATHS)
        .some(path => location.pathname.startsWith(`/${path}`));

    return (
        <ThemeProvider
            theme={appTheme}
            defaultMode='dark'
            storageManager={ThemeStorageManager}
        >
            <Suspense fallback={null}>
                <Visualizers />
            </Suspense>
            <Backdrop />
            <AppHeader isHidden={isExperimentalLayout || isNewLayoutPath} />

            <Outlet />
        </ThemeProvider>
    );
}
