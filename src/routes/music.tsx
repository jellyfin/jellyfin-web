import { createRoute } from '@tanstack/react-router';
import { lazy } from 'react';
import { Route } from './__root';

const MusicRecommendedPage = lazy(
    () => import('../apps/stable/routes/lazyRoutes/MusicRecommendedPage')
);
const MusicSongsPage = lazy(() => import('../apps/stable/routes/lazyRoutes/MusicSongsPage'));
const MusicAlbumsPage = lazy(() => import('../apps/stable/routes/lazyRoutes/MusicAlbumsPage'));
const MusicArtistsPage = lazy(() => import('../apps/stable/routes/lazyRoutes/MusicArtistsPage'));
const MusicGenresPage = lazy(() => import('../apps/stable/routes/lazyRoutes/MusicGenresPage'));
const MusicPlaylistsPage = lazy(
    () => import('../apps/stable/routes/lazyRoutes/MusicPlaylistsPage')
);

export const musicRecommendedRoute = createRoute({
    getParentRoute: () => Route,
    path: 'music',
    component: MusicRecommendedPage
});

export const musicSongsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'songs',
    component: MusicSongsPage
});

export const musicAlbumsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'musicalbums',
    component: MusicAlbumsPage
});

export const musicArtistsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'musicartists',
    component: MusicArtistsPage
});

export const musicGenresRoute = createRoute({
    getParentRoute: () => Route,
    path: 'musicgenres',
    component: MusicGenresPage
});

export const musicPlaylistsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'musicplaylists',
    component: MusicPlaylistsPage
});
