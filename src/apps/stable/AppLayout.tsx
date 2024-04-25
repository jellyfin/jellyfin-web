import React from 'react';
import { Outlet } from 'react-router-dom';

import AppBody from 'components/AppBody';

export default function AppLayout() {
    return (
        <AppBody>
            <Outlet />
        </AppBody>
    );
}
