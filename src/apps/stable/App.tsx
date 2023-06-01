import React from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import AppHeader from 'components/AppHeader';
import Backdrop from 'components/Backdrop';
import ServerContentPage from 'components/ServerContentPage';
import ConnectionRequired from 'components/ConnectionRequired';
import { toAsyncPageRoute } from 'components/router/AsyncRoute';
import { toViewManagerPageRoute } from 'components/router/LegacyRoute';

import { ASYNC_ADMIN_ROUTES, ASYNC_USER_ROUTES } from './routes/asyncRoutes';
import { LEGACY_ADMIN_ROUTES, LEGACY_PUBLIC_ROUTES, LEGACY_USER_ROUTES } from './routes/legacyRoutes';

const Layout = () => (
    <>
        <Backdrop />
        <AppHeader />

        <div className='mainAnimatedPages skinBody' />
        <div className='skinBody'>
            <Outlet />
        </div>
    </>
);

const StableApp = () => (
    <Routes>
        <Route element={<Layout />}>
            {/* User routes */}
            <Route path='/' element={<ConnectionRequired />}>
                {ASYNC_USER_ROUTES.map(toAsyncPageRoute)}
                {LEGACY_USER_ROUTES.map(toViewManagerPageRoute)}
            </Route>

            {/* Admin routes */}
            <Route path='/' element={<ConnectionRequired isAdminRequired />}>
                {ASYNC_ADMIN_ROUTES.map(toAsyncPageRoute)}
                {LEGACY_ADMIN_ROUTES.map(toViewManagerPageRoute)}

                <Route path='configurationpage' element={
                    <ServerContentPage view='/web/configurationpage' />
                } />
            </Route>

            {/* Public routes */}
            <Route path='/' element={<ConnectionRequired isUserRequired={false} />}>
                <Route index element={<Navigate replace to='/home.html' />} />

                {LEGACY_PUBLIC_ROUTES.map(toViewManagerPageRoute)}
            </Route>

            {/* Suppress warnings for unhandled routes */}
            <Route path='*' element={null} />
        </Route>
    </Routes>
);

export default StableApp;
