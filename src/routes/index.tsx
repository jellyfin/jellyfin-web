import loadable from '@loadable/component';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ConnectionRequired from '../components/ConnectionRequired';
import ServerContentPage from '../components/ServerContentPage';
import { LEGACY_ADMIN_ROUTES, LEGACY_USER_ROUTES, toViewManagerPageRoute } from './legacyRoutes';

interface AsyncPageProps {
    page: string
}

const AsyncPage = loadable(
    (props: AsyncPageProps) => import(/* webpackChunkName: "[request]" */ `./${props.page}`),
    { cacheKey: (props: AsyncPageProps) => props.page }
);

interface AsyncRoute {
    path: string
    page: string
}

const toAsyncPageRoute = (route: AsyncRoute) => (
    <Route
        key={route.path}
        path={route.path}
        element={<AsyncPage page={route.page} />}
    />
);

const USER_ROUTES: AsyncRoute[] = [
    { path: 'search.html', page: 'search' },
    { path: 'userprofile.html', page: 'user/userprofile' },
    { path: 'home.html', page: 'home' },
    { path: 'movies.html', page: 'movies' }
];

const ADMIN_ROUTES: AsyncRoute[] = [
    { path: 'usernew.html', page: 'user/usernew' },
    { path: 'userprofiles.html', page: 'user/userprofiles' },
    { path: 'useredit.html', page: 'user/useredit' },
    { path: 'userlibraryaccess.html', page: 'user/userlibraryaccess' },
    { path: 'userparentalcontrol.html', page: 'user/userparentalcontrol' },
    { path: 'userpassword.html', page: 'user/userpassword' }
];

const AppRoutes = () => (
    <Routes>
        <Route path='/'>
            {/* User routes */}
            <Route path='/' element={<ConnectionRequired />}>
                {USER_ROUTES.map(toAsyncPageRoute)}
                {LEGACY_USER_ROUTES.map(toViewManagerPageRoute)}
            </Route>

            {/* Admin routes */}
            <Route path='/' element={<ConnectionRequired isAdminRequired />}>
                {ADMIN_ROUTES.map(toAsyncPageRoute)}
                {LEGACY_ADMIN_ROUTES.map(toViewManagerPageRoute)}

                <Route path='configurationpage' element={
                    <ServerContentPage view='/web/configurationpage' />
                } />
            </Route>

            {/* Public routes */}
            <Route path='/' element={<ConnectionRequired isUserRequired={false} />}>
                <Route index element={<Navigate replace to='/home.html' />} />
            </Route>

            {/* Suppress warnings for unhandled routes */}
            <Route path='*' element={null} />
        </Route>
    </Routes>
);

export default AppRoutes;
