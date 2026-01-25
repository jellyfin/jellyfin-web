import { lazy } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route } from './__root';

const HomeVideosPage = lazy(() => import('../apps/stable/routes/lazyRoutes/HomeVideosPage'));

export const homeVideosRoute = createRoute({
    getParentRoute: () => Route,
    path: 'homevideos',
    component: HomeVideosPage
});
