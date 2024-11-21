import { AsyncRouteType, type AsyncRoute } from 'components/router/AsyncRoute';

export const ASYNC_ADMIN_ROUTES: AsyncRoute[] = [
    { path: 'activity', type: AsyncRouteType.Dashboard },
    { path: 'branding', type: AsyncRouteType.Dashboard },
    { path: 'playback/trickplay', type: AsyncRouteType.Dashboard },
    { path: 'plugins/:pluginId', page: 'plugins/plugin', type: AsyncRouteType.Dashboard },
    { path: 'users', type: AsyncRouteType.Dashboard },
    { path: 'users/access', type: AsyncRouteType.Dashboard },
    { path: 'users/add', type: AsyncRouteType.Dashboard },
    { path: 'users/parentalcontrol', type: AsyncRouteType.Dashboard },
    { path: 'users/password', type: AsyncRouteType.Dashboard },
    { path: 'users/profile', type: AsyncRouteType.Dashboard }
];
