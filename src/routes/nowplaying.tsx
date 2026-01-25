import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { Route } from './__root';

export const nowplayingRoute = createRoute({
    getParentRoute: () => Route,
    path: 'nowplaying',
    component: lazyRouteComponent(() => import('./nowplaying.lazy'))
});