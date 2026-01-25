import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { Route } from './__root';

export const videoRoute = createRoute({
    getParentRoute: () => Route,
    path: 'video',
    component: lazyRouteComponent(() => import('./video.lazy')),
});