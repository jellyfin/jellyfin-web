import { createRoute } from '@tanstack/react-router';
import { lazy } from 'react';
import { Route } from './__root';

const MetadataManagerPage = lazy(() => import('../apps/dashboard/routes/metadata'));

export const metadataRoute = createRoute({
    getParentRoute: () => Route,
    path: 'metadata',
    component: MetadataManagerPage
});
