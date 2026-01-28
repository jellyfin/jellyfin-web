import React, { type FC, type PropsWithChildren, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import ResponsiveDrawer, { DRAWER_WIDTH } from '../ResponsiveDrawer';
import AppBody from '../AppBody';
import { useUiStore } from '../../store/uiStore';
import browser from '../../scripts/browser';
import { Box } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';

export const MainLayout: FC<PropsWithChildren> = ({ children }) => {
    const isDrawerOpen = useUiStore((state) => state.isDrawerOpen);
    const toggleDrawer = useUiStore((state) => state.toggleDrawer);
    const isDesktop = !browser.mobile;

    // Auto-open drawer on desktop mount
    useEffect(() => {
        if (isDesktop) {
            // Check if we should auto-open (maybe check local storage or just default true)
            // For now, default to true for desktop
            if (!useUiStore.getState().isDrawerOpen) {
                 toggleDrawer(true);
            }
        }
    }, [isDesktop, toggleDrawer]);

    const handleDrawerClose = () => toggleDrawer(false);
    const handleDrawerOpen = () => toggleDrawer(true);

    // Calculate content offset
    const contentMarginLeft = isDesktop && isDrawerOpen ? DRAWER_WIDTH : 0;

    return (
        <>
            <Header />
            
            {/* 
                ResponsiveDrawer on desktop currently ignores 'open' prop and renders always if mounted.
                So we conditionally render it on desktop based on isDrawerOpen.
                On mobile, it handles the 'open' prop for the overlay.
            */}
            {(isDesktop ? isDrawerOpen : true) && (
                <ResponsiveDrawer 
                    open={isDrawerOpen} 
                    onClose={handleDrawerClose} 
                    onOpen={handleDrawerOpen}
                >
                    <Sidebar />
                </ResponsiveDrawer>
            )}

            <Box
                component="main"
                style={{
                    marginLeft: contentMarginLeft,
                    paddingTop: '64px', // Header height
                    minHeight: '100vh',
                    backgroundColor: vars.colors.background,
                    transition: 'margin-left 0.2s ease-out'
                }}
            >
                <AppBody>
                    {children}
                </AppBody>
            </Box>
        </>
    );
};
