import { lazy } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route } from './__root';

const HomePage = lazy(() => import('../apps/stable/routes/lazyRoutes/HomePage'));

export const homeRoute = createRoute({
    getParentRoute: () => Route,
    path: 'home',
    component: HomePage
});
