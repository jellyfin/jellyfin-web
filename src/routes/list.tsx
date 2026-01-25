import { lazy } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route } from './__root';

const ListPage = lazy(() => import('../apps/stable/routes/lazyRoutes/ListPage'));

export const listRoute = createRoute({
    getParentRoute: () => Route,
    path: 'list',
    component: ListPage
});
