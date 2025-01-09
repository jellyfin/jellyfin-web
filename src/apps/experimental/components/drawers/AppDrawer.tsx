import React, { FC } from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';

import { DRAWER_WIDTH, type ResponsiveDrawerProps } from 'components/ResponsiveDrawer';
import browser from 'scripts/browser';

import { ASYNC_USER_ROUTES } from '../../routes/asyncRoutes';
import { LEGACY_USER_ROUTES } from '../../routes/legacyRoutes';

import MainDrawerContent from './MainDrawerContent';
import { isTabPath } from '../tabs/tabRoutes';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Theme } from '@mui/material/styles';

const DRAWERLESS_ROUTES = [
    'video' // video player
];

const MAIN_DRAWER_ROUTES = [
    ...ASYNC_USER_ROUTES,
    ...LEGACY_USER_ROUTES
].filter(route => !DRAWERLESS_ROUTES.includes(route.path));

/** Utility function to check if a path has a drawer. */
export const isDrawerPath = (path: string) => (
    MAIN_DRAWER_ROUTES.some(route => route.path === path || `/${route.path}` === path)
);

const AppDrawer: FC<ResponsiveDrawerProps> = ({
    open = false,
    onClose,
    onOpen
}) => {
    const isMediumScreen = useMediaQuery((t: Theme) => t.breakpoints.up('md'));
    const location = useLocation();

    return (
        <SwipeableDrawer
            anchor={isMediumScreen ? 'left' : 'top'}
            open={open}
            onClose={onClose}
            onOpen={onOpen}
            // Disable swipe to open on iOS since it interferes with back navigation
            disableDiscovery={browser.iOS}
            ModalProps={{
                keepMounted: true // Better open performance on mobile.
            }}
            sx={{
                width: { md: DRAWER_WIDTH },
                '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                    height: '100%',
                    width: { md: DRAWER_WIDTH },
                    paddingTop: {
                        xs: isTabPath(location.pathname) ? '6.5rem' : '3.25rem',
                        lg: '3.25rem'
                    }, // Padding for toolbar
                    paddingBottom: '4.2rem' // Padding for now playing bar
                }
            }}
        >
            <Box
                role='presentation'
                // Close the drawer when the content is clicked
                onClick={onClose}
                onKeyDown={onClose}
            >
                <MainDrawerContent />
            </Box>
        </SwipeableDrawer>
    );
};

export default AppDrawer;
