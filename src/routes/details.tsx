import { createRoute } from '@tanstack/react-router';
import { lazy } from 'react';
import { Route } from './__root';

const DetailsPage = lazy(() => import('../apps/stable/routes/lazyRoutes/DetailsPage'));

export const detailsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'details',
    component: DetailsPage
});
