import React, { type FC } from 'react';
import AppToolbar from '../toolbar/AppToolbar';
import { useUiStore } from '../../store/uiStore';
import { Box } from 'ui-primitives';
import { vars } from '../../styles/tokens.css';
import { DRAWER_WIDTH } from '../ResponsiveDrawer';
import browser from '../../scripts/browser';
import { Tabs } from './Tabs';
import { HeaderActions } from './HeaderActions';
import { appRouter } from '../router/appRouter';

export const Header: FC = () => {
    const isDrawerOpen = useUiStore((state) => state.isDrawerOpen);
    const toggleDrawer = useUiStore((state) => state.toggleDrawer);
    const isDesktop = !browser.mobile;
    const leftOffset = isDesktop && isDrawerOpen ? `${DRAWER_WIDTH}px` : '0';

    return (
        <Box
            component="header"
            style={{
                position: 'fixed',
                top: 0,
                right: 0,
                left: leftOffset,
                zIndex: vars.zIndex.sticky,
                backgroundColor: vars.colors.surface,
                borderBottom: '1px solid',
                borderColor: vars.colors.divider,
                transition: 'left 0.2s ease-out'
            }}
        >
            <AppToolbar
                isDrawerOpen={isDrawerOpen}
                onDrawerButtonClick={() => toggleDrawer()}
                isDrawerAvailable={true}
                buttons={<HeaderActions />}
                isBackButtonAvailable={appRouter.canGoBack()}
            />
            <Tabs />
        </Box>
    );
};