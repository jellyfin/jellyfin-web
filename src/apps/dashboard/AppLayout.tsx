import React from 'react';
import { Outlet } from 'react-router-dom';

import AppBody from 'components/AppBody';

import '../experimental/AppOverrides.scss';

const AppLayout = () => {
    return (
        <AppBody>
            <Outlet />
        </AppBody>
    );
};

export default AppLayout;
