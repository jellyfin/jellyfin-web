import { lazy } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route } from './__root';

const QueuePage = lazy(() => import('../apps/stable/routes/lazyRoutes/QueuePage'));

export const queueRoute = createRoute({
    getParentRoute: () => Route,
    path: 'queue',
    component: QueuePage
});
