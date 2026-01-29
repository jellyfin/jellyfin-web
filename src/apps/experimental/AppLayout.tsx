import { Outlet, useLocation } from '@tanstack/react-router';
import AppBody from 'components/AppBody';
import CustomCss from 'components/CustomCss';
import { useApi } from 'hooks/useApi';
import useMediaQuery from 'hooks/useMediaQuery';
import React, { StrictMode, useCallback, useEffect, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Box } from 'ui-primitives';

import AppToolbar from './components/AppToolbar';
import AppDrawer, { isDrawerPath } from './components/drawers/AppDrawer';

import './AppOverrides.scss';

export const Component = () => {
    const [isDrawerActive, setIsDrawerActive] = useState(false);
    const { user } = useApi();
    const location = useLocation();

    const isMediumScreen = useMediaQuery('(min-width: 960px)');
    const isDrawerAvailable = isDrawerPath(location.pathname) && Boolean(user) && !isMediumScreen;
    const isDrawerOpen = isDrawerActive && isDrawerAvailable;
    const [isElevated, setIsElevated] = useState(false);

    const onToggleDrawer = useCallback(() => {
        setIsDrawerActive(!isDrawerActive);
    }, [isDrawerActive, setIsDrawerActive]);

    useEffect(() => {
        const handleScroll = () => {
            setIsElevated(window.scrollY > 0);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <Box style={{ position: 'relative', display: 'flex', height: '100%' }}>
                <StrictMode>
                    <Box
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            width: '100%',
                            marginLeft: 0,
                            zIndex: 100,
                            boxShadow: isElevated ? vars.shadows.md : 'none'
                        }}
                    >
                        <AppToolbar
                            isDrawerAvailable={!isMediumScreen && isDrawerAvailable}
                            isDrawerOpen={isDrawerOpen}
                            onDrawerButtonClick={onToggleDrawer}
                        />
                    </Box>

                    {isDrawerAvailable && (
                        <AppDrawer
                            open={isDrawerOpen}
                            onClose={onToggleDrawer}
                            onOpen={onToggleDrawer}
                        />
                    )}
                </StrictMode>

                <Box
                    as="main"
                    style={{
                        width: '100%',
                        flexGrow: 1,
                        paddingTop: '160px'
                    }}
                >
                    <AppBody>
                        <Outlet />
                    </AppBody>
                </Box>
            </Box>
            <CustomCss />
        </>
    );
};
