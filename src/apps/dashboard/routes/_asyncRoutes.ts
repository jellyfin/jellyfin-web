import { AsyncRouteType, type AsyncRoute } from 'components/router/AsyncRoute';

export const ASYNC_ADMIN_ROUTES: AsyncRoute[] = [
    { path: 'activity', type: AsyncRouteType.Dashboard },
    { path: 'users', type: AsyncRouteType.Dashboard },
    { path: 'users/add', type: AsyncRouteType.Dashboard },
    { path: 'users/settings', type: AsyncRouteType.Dashboard },
    { path: 'playback/trickplay', type: AsyncRouteType.Dashboard }
];
