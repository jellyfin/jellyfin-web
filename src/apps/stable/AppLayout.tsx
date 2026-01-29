import { Outlet } from '@tanstack/react-router';
import AppBody from 'components/AppBody';
import CustomCss from 'components/CustomCss';
import React from 'react';

export default function AppLayout() {
    return (
        <>
            <AppBody>
                <Outlet />
            </AppBody>
            <CustomCss />
        </>
    );
}
