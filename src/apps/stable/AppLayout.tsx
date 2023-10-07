import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import AppBody from 'components/AppBody';
import { DASHBOARD_APP_PATHS } from 'apps/dashboard/routes/routes';
import Backdrop from 'components/Backdrop';
import AppHeader from 'components/AppHeader';

export default function AppLayout() {
    const location = useLocation();
    const isNewLayoutPath = Object.values(DASHBOARD_APP_PATHS)
        .some(path => location.pathname.startsWith(`/${path}`));

    return (
        <>
            <Backdrop />
            <AppHeader isHidden={isNewLayoutPath} />

            <AppBody>
                <Outlet />
            </AppBody>
        </>
    );
}
