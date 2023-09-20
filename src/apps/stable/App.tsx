import React from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import AppBody from 'components/AppBody';
import ConnectionRequired from 'components/ConnectionRequired';
import { toAsyncPageRoute } from 'components/router/AsyncRoute';
import { toViewManagerPageRoute } from 'components/router/LegacyRoute';

import { ASYNC_USER_ROUTES } from './routes/asyncRoutes';
import { LEGACY_PUBLIC_ROUTES, LEGACY_USER_ROUTES } from './routes/legacyRoutes';
import { REDIRECTS } from './routes/_redirects';
import { toRedirectRoute } from 'components/router/Redirect';

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

            {/* Ignore dashboard routes */}
            <Route path='/configurationpage/*' element={null} />
            <Route path='/dashboard/*' element={null} />
            <Route path='/metadata/*' element={null} />

            {/* Suppress warnings for unhandled routes */}
            <Route path='*' element={null} />
        </Route>

        {/* Redirects for old paths */}
        {REDIRECTS.map(toRedirectRoute)}
    </Routes>
);

export default StableApp;
