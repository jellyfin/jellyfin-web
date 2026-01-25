import { lazy } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route } from './__root';

const LyricsPage = lazy(() => import('../apps/stable/routes/lazyRoutes/LyricsPage'));

export const lyricsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'lyrics',
    component: LyricsPage
});
