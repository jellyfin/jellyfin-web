import { AsyncRouteType, type AsyncRoute } from 'components/router/AsyncRoute';

export const ASYNC_ADMIN_ROUTES: AsyncRoute[] = [
    { path: 'activity', type: AsyncRouteType.Dashboard },
    { path: 'playback/trickplay', type: AsyncRouteType.Dashboard },
    { path: 'plugins/:pluginId', page: 'plugins/plugin', type: AsyncRouteType.Dashboard },
    { path: 'users', type: AsyncRouteType.Dashboard },
    { path: 'users/add', type: AsyncRouteType.Dashboard }
];

export const ASYNC_User_Settings_ROUTES: AsyncRoute[] = [
    { path: 'access', page: 'users/settings/access', type: AsyncRouteType.Dashboard },
    { path: 'parentalcontrol', page: 'users/settings/parentalcontrol', type: AsyncRouteType.Dashboard },
    { path: 'password', page: 'users/settings/password', type: AsyncRouteType.Dashboard },
    { path: 'profile', page: 'users/settings/profile', type: AsyncRouteType.Dashboard }
];
