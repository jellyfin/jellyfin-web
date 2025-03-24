import React from 'react';
import { Outlet } from 'react-router-dom';

import AppBody from 'components/AppBody';
import ThemeCss from 'components/ThemeCss';
import CustomCss from 'components/CustomCss';

export default function AppLayout() {
    return (
        <>
            <AppBody>
                <Outlet />
            </AppBody>
            <ThemeCss />
            <CustomCss />
        </>
    );
}
