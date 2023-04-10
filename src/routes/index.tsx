import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ASYNC_USER_ROUTES, toAsyncPageRoute } from './asyncRoutes';
import ConnectionRequired from '../components/ConnectionRequired';
import ServerContentPage from '../components/ServerContentPage';
import { LEGACY_ADMIN_ROUTES, LEGACY_PUBLIC_ROUTES, LEGACY_USER_ROUTES, toViewManagerPageRoute } from './legacyRoutes';

const AppRoutes = () => (
    <Routes>
        <Route path='/'>
            {/* User routes */}
            <Route path='/' element={<ConnectionRequired />}>
                {ASYNC_USER_ROUTES.map(toAsyncPageRoute)}
                {LEGACY_USER_ROUTES.map(toViewManagerPageRoute)}
            </Route>

            {/* Admin routes */}
            <Route path='/' element={<ConnectionRequired isAdminRequired />}>
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

export default AppRoutes;
