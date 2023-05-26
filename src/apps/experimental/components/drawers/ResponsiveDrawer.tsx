import { Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { FC, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import browser from 'scripts/browser';

import { DRAWER_WIDTH } from './AppDrawer';
import { isTabPath } from '../tabs/tabRoutes';

export interface ResponsiveDrawerProps {
    open: boolean
    onClose: () => void
    onOpen: () => void
}

const ResponsiveDrawer: FC<ResponsiveDrawerProps> = ({
    children,
    open = false,
    onClose,
    onOpen
}) => {
    const location = useLocation();
    const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.up('sm'));
    const isLargeScreen = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
    const isTallToolbar = isTabPath(location.pathname) && !isLargeScreen;

    const getToolbarStyles = useCallback((theme: Theme) => ({
        marginBottom: isTallToolbar ? theme.spacing(6) : 0
    }), [ isTallToolbar ]);

    return ( isSmallScreen ? (
        /* DESKTOP DRAWER */
        <Drawer
            sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    boxSizing: 'border-box'
                }
            }}
            variant='persistent'
            anchor='left'
            open={open}
        >
            <Toolbar
                variant='dense'
                sx={getToolbarStyles}
            />
            {children}
        </Drawer>
    ) : (
        /* MOBILE DRAWER */
        <SwipeableDrawer
            anchor='left'
            open={open}
            onClose={onClose}
            onOpen={onOpen}
            // Disable swipe to open on iOS since it interferes with back navigation
            disableDiscovery={browser.iOS}
            ModalProps={{
                keepMounted: true // Better open performance on mobile.
            }}
        >
            <Toolbar
                variant='dense'
                sx={getToolbarStyles}
            />
            <Box
                role='presentation'
                // Close the drawer when the content is clicked
                onClick={onClose}
                onKeyDown={onClose}
            >
                {children}
            </Box>
        </SwipeableDrawer>
    ));
};

export default ResponsiveDrawer;
