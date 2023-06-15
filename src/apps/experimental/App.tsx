import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ConnectionRequired from 'components/ConnectionRequired';
import ServerContentPage from 'components/ServerContentPage';
import { toAsyncPageRoute } from 'components/router/AsyncRoute';
import { toViewManagerPageRoute } from 'components/router/LegacyRoute';

import AppLayout from './AppLayout';
import { ASYNC_ADMIN_ROUTES, ASYNC_USER_ROUTES } from './routes/asyncRoutes';
import { LEGACY_ADMIN_ROUTES, LEGACY_PUBLIC_ROUTES, LEGACY_USER_ROUTES } from './routes/legacyRoutes';

const ExperimentalApp = () => {
    return (
        <Routes>
            <Route path='/*' element={<AppLayout />}>
                {/* User routes */}
                <Route element={<ConnectionRequired />}>
                    {ASYNC_USER_ROUTES.map(toAsyncPageRoute)}
                    {LEGACY_USER_ROUTES.map(toViewManagerPageRoute)}
                </Route>

                {/* Admin routes */}
                <Route element={<ConnectionRequired isAdminRequired />}>
                    {ASYNC_ADMIN_ROUTES.map(toAsyncPageRoute)}
                    {LEGACY_ADMIN_ROUTES.map(toViewManagerPageRoute)}

                    <Route path='configurationpage' element={
                        <ServerContentPage view='/web/configurationpage' />
                    } />
                </Route>

                {/* Public routes */}
                <Route element={<ConnectionRequired isUserRequired={false} />}>
                    <Route index element={<Navigate replace to='/home.html' />} />

                    {LEGACY_PUBLIC_ROUTES.map(toViewManagerPageRoute)}
                </Route>
            </Route>
        </Routes>
    );
};

export default ExperimentalApp;
