import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { Route } from './__root';

export const settingsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'mypreferencesmenu',
    component: lazyRouteComponent(() => import('./user.lazy'), 'SettingsPage')
});

export const userprofileRoute = createRoute({
    getParentRoute: () => Route,
    path: 'userprofile',
    component: lazyRouteComponent(() => import('./user.lazy'), 'UserProfilePage')
});

export const searchRoute = createRoute({
    getParentRoute: () => Route,
    path: 'search',
    component: lazyRouteComponent(() => import('./user.lazy'), 'SearchPage')
});

export const quickconnectRoute = createRoute({
    getParentRoute: () => Route,
    path: 'quickconnect',
    component: lazyRouteComponent(() => import('./user.lazy'), 'QuickConnectPage')
});