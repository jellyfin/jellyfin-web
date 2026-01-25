import React, { type FC, type PropsWithChildren } from 'react';
import browser from 'scripts/browser';
import { Drawer } from 'ui-primitives/Drawer';
import { Box } from 'ui-primitives/Box';
import { vars } from 'styles/tokens.css';

export const DRAWER_WIDTH = 240;

export interface ResponsiveDrawerProps {
    open: boolean;
    onClose: () => void;
    onOpen: () => void;
}

const ResponsiveDrawer: FC<PropsWithChildren<ResponsiveDrawerProps>> = ({ children, open = false, onClose }) => {
    if (browser.mobile) {
        return (
            <Drawer
                anchor="left"
                open={open}
                onClose={onClose}
                style={{
                    zIndex: 1300
                }}
            >
                <Box
                    role="presentation"
                    onClick={onClose}
                    onKeyDown={onClose}
                    style={{ height: '100%', overflowY: 'auto' }}
                >
                    {children}
                </Box>
            </Drawer>
        );
    }

    return (
        <Box
            component="nav"
            style={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                borderRight: '1px solid',
                borderColor: vars.colors.border,
                backgroundColor: vars.colors.surface,
                overflowY: 'auto',
                paddingBottom: '12rem',
                zIndex: 1200
            }}
        >
            {children}
        </Box>
    );
};

export default ResponsiveDrawer;
