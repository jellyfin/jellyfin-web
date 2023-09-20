import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { Outlet } from 'react-router-dom';

import AppHeader from 'components/AppHeader';
import Backdrop from 'components/Backdrop';
import theme from 'themes/theme';

const AppLayout = () => {
    return (
        <ThemeProvider theme={theme}>
            <Backdrop />

            <div style={{ display: 'none' }}>
                {/*
                  * TODO: These components are not used, but views interact with them directly so the need to be
                  * present in the dom. We add them in a hidden element to prevent errors.
                  */}
                <AppHeader />
            </div>

            <div className='mainAnimatedPages skinBody' />
            <div className='skinBody'>
                <Outlet />
            </div>
        </ThemeProvider>
    );
};

export default AppLayout;
