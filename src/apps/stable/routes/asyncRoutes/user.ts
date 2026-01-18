import { AsyncRoute } from '../../../../components/router/AsyncRoute';

export const ASYNC_USER_ROUTES: AsyncRoute[] = [
    { path: 'mypreferencesmenu', page: 'user/settings' },
    { path: 'quickconnect', page: 'quickConnect' },
    { path: 'search', page: 'search' },
    { path: 'userprofile', page: 'user/userprofile' },
    // 🔥 CRITICAL: Lazy-loaded main entry point - MAXIMUM IMPACT
    { path: 'home', page: 'lazyRoutes/HomePage' },

    // 🔥 CRITICAL: Convert remaining legacy routes - HIGH IMPACT
    { path: 'video', page: 'lazyRoutes/VideoPlayerPage' },
    { path: 'queue', page: 'lazyRoutes/QueuePage' },
    { path: 'details', page: 'lazyRoutes/DetailsPage' },
    { path: 'list', page: 'lazyRoutes/ListPage' },

    // Lazy-loaded routes for better performance - Main sections
    { path: 'music', page: 'lazyRoutes/MusicRecommendedPage' },
    { path: 'movies', page: 'lazyRoutes/MoviesRecommendedPage' },
    { path: 'tv', page: 'lazyRoutes/TVRecommendedPage' },
    // Music sub-routes
    { path: 'songs', page: 'lazyRoutes/MusicSongsPage' },
    { path: 'musicalbums', page: 'lazyRoutes/MusicAlbumsPage' },
    { path: 'musicartists', page: 'lazyRoutes/MusicArtistsPage' },
    { path: 'musicgenres', page: 'lazyRoutes/MusicGenresPage' },
    { path: 'musicplaylists', page: 'lazyRoutes/MusicPlaylistsPage' },
    // Movie sub-routes
    { path: 'moviecollections', page: 'lazyRoutes/MovieCollectionsPage' },
    { path: 'moviegenres', page: 'lazyRoutes/MovieGenresPage' },
    // TV sub-routes
    { path: 'tvshows', page: 'lazyRoutes/TVShowsPage' },
    { path: 'tvupcoming', page: 'lazyRoutes/TVUpcomingPage' },
    { path: 'tvgenres', page: 'lazyRoutes/TVGenresPage' },
    { path: 'tvstudios', page: 'lazyRoutes/TVStudiosPage' },
    { path: 'episodes', page: 'lazyRoutes/EpisodesPage' },
    // Live TV sub-routes
    { path: 'livetvchannels', page: 'lazyRoutes/LiveTVChannelsPage' },
    { path: 'livetvguide', page: 'lazyRoutes/LiveTVGuidePage' },
    { path: 'livetvrecordings', page: 'lazyRoutes/LiveTVRecordingsPage' },
    { path: 'livetvschedule', page: 'lazyRoutes/LiveTVSchedulePage' },
    { path: 'livetvseriestimers', page: 'lazyRoutes/LiveTVSeriesTimersPage' }
];
