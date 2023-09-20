import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { REDIRECTS } from 'apps/stable/routes/_redirects';
import ConnectionRequired from 'components/ConnectionRequired';
import { toAsyncPageRoute } from 'components/router/AsyncRoute';
import { toViewManagerPageRoute } from 'components/router/LegacyRoute';
import { toRedirectRoute } from 'components/router/Redirect';

import AppLayout from './AppLayout';
import { ASYNC_USER_ROUTES } from './routes/asyncRoutes';
import { LEGACY_PUBLIC_ROUTES, LEGACY_USER_ROUTES } from './routes/legacyRoutes';

const ExperimentalApp = () => {
    return (
        <Routes>
            <Route path='/*' element={<AppLayout />}>
                {/* User routes */}
                <Route element={<ConnectionRequired />}>
                    {ASYNC_USER_ROUTES.map(toAsyncPageRoute)}
                    {LEGACY_USER_ROUTES.map(toViewManagerPageRoute)}
                </Route>

                {/* Public routes */}
                <Route element={<ConnectionRequired isUserRequired={false} />}>
                    <Route index element={<Navigate replace to='/home.html' />} />

                    {LEGACY_PUBLIC_ROUTES.map(toViewManagerPageRoute)}
                </Route>
            </Route>

            {/* Redirects for old paths */}
            {REDIRECTS.map(toRedirectRoute)}

            {/* Ignore dashboard routes */}
            <Route path='/configurationpage/*' element={null} />
            <Route path='/dashboard/*' element={null} />
            <Route path='/metadata/*' element={null} />
        </Routes>
    );
};

export default ExperimentalApp;
