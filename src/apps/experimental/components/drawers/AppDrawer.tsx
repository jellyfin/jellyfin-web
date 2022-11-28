import React, { FC } from 'react';
import { Route, Routes } from 'react-router-dom';

import { ASYNC_ADMIN_ROUTES, ASYNC_USER_ROUTES } from '../../routes/asyncRoutes';
import { LEGACY_ADMIN_ROUTES, LEGACY_USER_ROUTES } from '../../routes/legacyRoutes';

import AdvancedDrawerSection from './dashboard/AdvancedDrawerSection';
import DevicesDrawerSection from './dashboard/DevicesDrawerSection';
import LiveTvDrawerSection from './dashboard/LiveTvDrawerSection';
import PluginDrawerSection from './dashboard/PluginDrawerSection';
import ServerDrawerSection from './dashboard/ServerDrawerSection';
import MainDrawerContent from './MainDrawerContent';
import ResponsiveDrawer, { ResponsiveDrawerProps } from './ResponsiveDrawer';

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
                        <ResponsiveDrawer
                            open={open}
                            onClose={onClose}
                            onOpen={onOpen}
                        >
                            <MainDrawerContent />
                        </ResponsiveDrawer>
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
                        <ResponsiveDrawer
                            open={open}
                            onClose={onClose}
                            onOpen={onOpen}
                        >
                            <ServerDrawerSection />
                            <DevicesDrawerSection />
                            <LiveTvDrawerSection />
                            <AdvancedDrawerSection />
                            <PluginDrawerSection />
                        </ResponsiveDrawer>
                    }
                />
            ))
        }

        {/* Suppress warnings for unhandled routes */}
        <Route path='*' element={null} />
    </Routes>
);

export default AppDrawer;
