import React, { FC } from 'react';

import ResponsiveDrawer, { ResponsiveDrawerProps } from '@/components/ResponsiveDrawer';

import { ASYNC_USER_ROUTES } from '@/apps/experimental/routes/asyncRoutes';
import { LEGACY_USER_ROUTES } from '@/apps/experimental/routes/legacyRoutes';

import MainDrawerContent from './MainDrawerContent';

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
}) => (
    <ResponsiveDrawer
        open={open}
        onClose={onClose}
        onOpen={onOpen}
    >
        <MainDrawerContent />
    </ResponsiveDrawer>
);

export default AppDrawer;
