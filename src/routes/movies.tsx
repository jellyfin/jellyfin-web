import { createRoute } from '@tanstack/react-router';
import { lazy } from 'react';
import { Route } from './__root';

const MoviesRecommendedPage = lazy(
    () => import('../apps/stable/routes/lazyRoutes/MoviesRecommendedPage')
);
const MovieCollectionsPage = lazy(
    () => import('../apps/stable/routes/lazyRoutes/MovieCollectionsPage')
);
const MovieGenresPage = lazy(() => import('../apps/stable/routes/lazyRoutes/MovieGenresPage'));

export const moviesRecommendedRoute = createRoute({
    getParentRoute: () => Route,
    path: 'movies',
    component: MoviesRecommendedPage
});

export const movieCollectionsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'moviecollections',
    component: MovieCollectionsPage
});

export const movieGenresRoute = createRoute({
    getParentRoute: () => Route,
    path: 'moviegenres',
    component: MovieGenresPage
});
