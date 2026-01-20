import Box from '@mui/joy/Box';
import Drawer from '@mui/joy/Drawer';
import ModalClose from '@mui/joy/ModalClose';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { type FC, type PropsWithChildren } from 'react';

import browser from 'scripts/browser';

export const DRAWER_WIDTH = 240;

export interface ResponsiveDrawerProps {
    open: boolean
    onClose: () => void
    onOpen: () => void
}

const ResponsiveDrawer: FC<PropsWithChildren<ResponsiveDrawerProps>> = ({
    children,
    open = false,
    onClose
}) => {
    const isMediumScreen = useMediaQuery((theme: any) => theme.breakpoints.up('md'));

    if (isMediumScreen) {
        return (
            <Box
                component="nav"
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.surface',
                    overflowY: 'auto',
                    pb: '12rem', // Padding for now playing bar
                    zIndex: 1200
                }}
            >
                {children}
            </Box>
        );
    }

    return (
        <Drawer
            anchor='left'
            open={open}
            onClose={onClose}
            sx={{
                zIndex: 1300,
                '& .MuiDrawer-content': {
                    width: DRAWER_WIDTH,
                    p: 0
                }
            }}
        >
            <ModalClose />
            <Box
                role='presentation'
                onClick={onClose}
                onKeyDown={onClose}
                sx={{ height: '100%', overflowY: 'auto' }}
            >
                {children}
            </Box>
        </Drawer>
    );
};

export default ResponsiveDrawer;