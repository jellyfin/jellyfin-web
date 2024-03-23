import { AsyncRouteType, type AsyncRoute } from 'components/router/AsyncRoute';

export const ASYNC_ADMIN_ROUTES: AsyncRoute[] = [
    { path: 'activity', type: AsyncRouteType.Dashboard },
    { path: 'dlna', type: AsyncRouteType.Dashboard },
    { path: 'notifications', type: AsyncRouteType.Dashboard },
    { path: 'users', type: AsyncRouteType.Dashboard },
    { path: 'users/add', type: AsyncRouteType.Dashboard },
    { path: 'users/edit', type: AsyncRouteType.Dashboard }
];
