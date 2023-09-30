import React from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { DASHBOARD_APP_PATHS } from 'apps/dashboard/App';
import AppBody from 'components/AppBody';
import ConnectionRequired from 'components/ConnectionRequired';
import { toAsyncPageRoute } from 'components/router/AsyncRoute';
import { toViewManagerPageRoute } from 'components/router/LegacyRoute';
import { toRedirectRoute } from 'components/router/Redirect';

import { ASYNC_USER_ROUTES } from './routes/asyncRoutes';
import { LEGACY_PUBLIC_ROUTES, LEGACY_USER_ROUTES } from './routes/legacyRoutes';
import { REDIRECTS } from './routes/_redirects';

const Layout = () => (
    <AppBody>
        <Outlet />
    </AppBody>
);

const StableApp = () => (
    <Routes>
        <Route element={<Layout />}>
            {/* User routes */}
            <Route path='/' element={<ConnectionRequired />}>
                {ASYNC_USER_ROUTES.map(toAsyncPageRoute)}
                {LEGACY_USER_ROUTES.map(toViewManagerPageRoute)}
            </Route>

            {/* Public routes */}
            <Route path='/' element={<ConnectionRequired isUserRequired={false} />}>
                <Route index element={<Navigate replace to='/home.html' />} />

                {LEGACY_PUBLIC_ROUTES.map(toViewManagerPageRoute)}
            </Route>

            {/* Suppress warnings for unhandled routes */}
            <Route path='*' element={null} />
        </Route>

        {/* Redirects for old paths */}
        {REDIRECTS.map(toRedirectRoute)}

        {/* Ignore dashboard routes */}
        {Object.entries(DASHBOARD_APP_PATHS).map(([ key, path ]) => (
            <Route
                key={key}
                path={`/${path}/*`}
                element={null}
            />
        ))}
    </Routes>
);

export default StableApp;
