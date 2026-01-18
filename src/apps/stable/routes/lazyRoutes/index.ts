import React, { lazy } from 'react';

// Lazy load critical routes - MAXIMUM IMPACT
export const HomePage = lazy(() => import('./HomePage'));

// 🔥 CRITICAL: Convert remaining legacy routes to lazy loading
export const VideoPlayerPage = lazy(() => import('./VideoPlayerPage'));
export const QueuePage = lazy(() => import('./QueuePage'));
export const DetailsPage = lazy(() => import('./DetailsPage'));
export const ListPage = lazy(() => import('./ListPage'));

// Lazy load music routes - high impact for bundle size reduction
export const MusicSongsPage = lazy(() => import('./MusicSongsPage'));
export const MusicAlbumsPage = lazy(() => import('./MusicAlbumsPage'));
export const MusicArtistsPage = lazy(() => import('./MusicArtistsPage'));
export const MusicGenresPage = lazy(() => import('./MusicGenresPage'));
export const MusicPlaylistsPage = lazy(() => import('./MusicPlaylistsPage'));

// Lazy load movie routes
export const MoviesPage = lazy(() => import('./MoviesPage'));
export const MovieCollectionsPage = lazy(() => import('./MovieCollectionsPage'));
export const MovieGenresPage = lazy(() => import('./MovieGenresPage'));

// Lazy load TV routes
export const TVShowsPage = lazy(() => import('./TVShowsPage'));
export const TVUpcomingPage = lazy(() => import('./TVUpcomingPage'));
export const TVGenresPage = lazy(() => import('./TVGenresPage'));
export const TVStudiosPage = lazy(() => import('./TVStudiosPage'));

// Lazy load Live TV routes
export const LiveTVChannelsPage = lazy(() => import('./LiveTVChannelsPage'));
export const LiveTVGuidePage = lazy(() => import('./LiveTVGuidePage'));
export const LiveTVRecordingsPage = lazy(() => import('./LiveTVRecordingsPage'));
export const LiveTVSchedulePage = lazy(() => import('./LiveTVSchedulePage'));
export const LiveTVSeriesTimersPage = lazy(() => import('./LiveTVSeriesTimersPage'));