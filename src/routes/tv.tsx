import { createRoute } from '@tanstack/react-router';
import { lazy } from 'react';
import { Route } from './__root';

const TVRecommendedPage = lazy(() => import('../apps/stable/routes/lazyRoutes/TVRecommendedPage'));
const TVShowsPage = lazy(() => import('../apps/stable/routes/lazyRoutes/TVShowsPage'));
const TVUpcomingPage = lazy(() => import('../apps/stable/routes/lazyRoutes/TVUpcomingPage'));
const TVGenresPage = lazy(() => import('../apps/stable/routes/lazyRoutes/TVGenresPage'));
const TVStudiosPage = lazy(() => import('../apps/stable/routes/lazyRoutes/TVStudiosPage'));
const EpisodesPage = lazy(() => import('../apps/stable/routes/lazyRoutes/EpisodesPage'));

export const tvRecommendedRoute = createRoute({
    getParentRoute: () => Route,
    path: 'tv',
    component: TVRecommendedPage
});

export const tvShowsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'tvshows',
    component: TVShowsPage
});

export const tvUpcomingRoute = createRoute({
    getParentRoute: () => Route,
    path: 'tvupcoming',
    component: TVUpcomingPage
});

export const tvGenresRoute = createRoute({
    getParentRoute: () => Route,
    path: 'tvgenres',
    component: TVGenresPage
});

export const tvStudiosRoute = createRoute({
    getParentRoute: () => Route,
    path: 'tvstudios',
    component: TVStudiosPage
});

export const episodesRoute = createRoute({
    getParentRoute: () => Route,
    path: 'episodes',
    component: EpisodesPage
});
