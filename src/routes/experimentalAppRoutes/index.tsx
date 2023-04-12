import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ConnectionRequired from '../../components/ConnectionRequired';
import ServerContentPage from '../../components/ServerContentPage';
import { toAsyncPageRoute } from '../AsyncRoute';
import { toViewManagerPageRoute } from '../LegacyRoute';
import { ASYNC_ADMIN_ROUTES } from './asyncRoutes/admin';
import { ASYNC_USER_ROUTES } from './asyncRoutes/user';
import { LEGACY_ADMIN_ROUTES } from './legacyRoutes/admin';
import { LEGACY_PUBLIC_ROUTES } from './legacyRoutes/public';
import { LEGACY_USER_ROUTES } from './legacyRoutes/user';

export const ExperimentalAppRoutes = () => (
    <Routes>
        <Route path='/'>
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
