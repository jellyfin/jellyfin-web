import React, { FC } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import ResponsiveDrawer, { ResponsiveDrawerProps } from 'components/ResponsiveDrawer';

import { ASYNC_ADMIN_ROUTES, ASYNC_USER_ROUTES } from '../../routes/asyncRoutes';
import { LEGACY_ADMIN_ROUTES, LEGACY_USER_ROUTES } from '../../routes/legacyRoutes';

import AdvancedDrawerSection from './dashboard/AdvancedDrawerSection';
import DevicesDrawerSection from './dashboard/DevicesDrawerSection';
import LiveTvDrawerSection from './dashboard/LiveTvDrawerSection';
import PluginDrawerSection from './dashboard/PluginDrawerSection';
import ServerDrawerSection from './dashboard/ServerDrawerSection';
import MainDrawerContent from './MainDrawerContent';
import { isTabPath } from '../tabs/tabRoutes';

export const DRAWER_WIDTH = 240;

const DRAWERLESS_ROUTES = [
    'edititemmetadata.html', // metadata manager
    'video' // video player
];

const MAIN_DRAWER_ROUTES = [
    ...ASYNC_USER_ROUTES,
    ...LEGACY_USER_ROUTES
].filter(route => !DRAWERLESS_ROUTES.includes(route.path));

const ADMIN_DRAWER_ROUTES = [
    ...ASYNC_ADMIN_ROUTES,
    ...LEGACY_ADMIN_ROUTES,
    { path: '/configurationpage' } // Plugin configuration page
].filter(route => !DRAWERLESS_ROUTES.includes(route.path));

/** Utility function to check if a path has a drawer. */
export const isDrawerPath = (path: string) => (
    MAIN_DRAWER_ROUTES.some(route => route.path === path || `/${route.path}` === path)
        || ADMIN_DRAWER_ROUTES.some(route => route.path === path || `/${route.path}` === path)
);

const Drawer: FC<ResponsiveDrawerProps> = ({ children, ...props }) => {
    const location = useLocation();
    const hasSecondaryToolBar = isTabPath(location.pathname);

    return (
        <ResponsiveDrawer
            {...props}
            hasSecondaryToolBar={hasSecondaryToolBar}
        >
            {children}
        </ResponsiveDrawer>
    );
};

const AppDrawer: FC<ResponsiveDrawerProps> = ({
    open = false,
    onClose,
    onOpen
}) => (
    <Routes>
        {
            MAIN_DRAWER_ROUTES.map(route => (
                <Route
                    key={route.path}
                    path={route.path}
                    element={
                        <Drawer
                            open={open}
                            onClose={onClose}
                            onOpen={onOpen}
                        >
                            <MainDrawerContent />
                        </Drawer>
                    }
                />
            ))
        }
        {
            ADMIN_DRAWER_ROUTES.map(route => (
                <Route
                    key={route.path}
                    path={route.path}
                    element={
                        <Drawer
                            open={open}
                            onClose={onClose}
                            onOpen={onOpen}
                        >
                            <ServerDrawerSection />
                            <DevicesDrawerSection />
                            <LiveTvDrawerSection />
                            <AdvancedDrawerSection />
                            <PluginDrawerSection />
                        </Drawer>
                    }
                />
            ))
        }
    </Routes>
);

export default AppDrawer;
