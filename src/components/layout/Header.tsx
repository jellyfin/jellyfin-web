import React, { type FC } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Box } from 'ui-primitives';
import browser from '../../scripts/browser';
import { useUiStore } from '../../store/uiStore';
import { DRAWER_WIDTH } from '../ResponsiveDrawer';
import { appRouter } from '../router/appRouter';
import AppToolbar from '../toolbar/AppToolbar';
import { HeaderActions } from './HeaderActions';
import { Tabs } from './Tabs';

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
