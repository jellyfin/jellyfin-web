import { createRouter } from '@tanstack/react-router';
import { createHashHistory } from '@tanstack/react-router';
import { Route } from './routes/__root';
import { indexRoute } from './routes/index';
import { homeRoute } from './routes/home';
import { listRoute } from './routes/list';
import { detailsRoute } from './routes/details';
import { videoRoute } from './routes/video';
import { queueRoute } from './routes/queue';
import { nowplayingRoute } from './routes/nowplaying';
import { homeVideosRoute } from './routes/homevideos';
import {
    musicRecommendedRoute,
    musicSongsRoute,
    musicAlbumsRoute,
    musicArtistsRoute,
    musicGenresRoute,
    musicPlaylistsRoute
} from './routes/music';
import { moviesRecommendedRoute, movieCollectionsRoute, movieGenresRoute } from './routes/movies';
import {
    tvRecommendedRoute,
    tvShowsRoute,
    tvUpcomingRoute,
    tvGenresRoute,
    tvStudiosRoute,
    episodesRoute
} from './routes/tv';
import {
    livetvRoute,
    livetvChannelsRoute,
    livetvGuideRoute,
    livetvRecordingsRoute,
    livetvScheduleRoute,
    livetvSeriesTimersRoute
} from './routes/livetv';
import { settingsRoute, userprofileRoute, searchRoute, quickconnectRoute } from './routes/user';
import { lyricsRoute } from './routes/lyrics';
import { metadataRoute } from './routes/metadata';
import { loginRoute, selectServerRoute, testRoute, forgotPasswordPinRoute } from './routes/session';
import { devRoute } from './routes/dev';
import {
    userDisplaySettingsRoute,
    userControlsSettingsRoute,
    userPlaybackSettingsRoute,
    userSubtitleSettingsRoute,
    userHomeSettingsRoute
} from './routes/userPreferences';
import { wizardStartRoute, wizardUserRoute, wizardLibraryRoute, wizardSettingsRoute, wizardRemoteRoute, wizardFinishRoute } from './routes/wizard';
import { dashboardRoute } from './routes/dashboard';

const routeTree = Route.addChildren([
    indexRoute,
    homeRoute,
    homeVideosRoute,
    listRoute,
    detailsRoute,
    videoRoute,
    queueRoute,
    nowplayingRoute,
    musicRecommendedRoute,
    musicSongsRoute,
    musicAlbumsRoute,
    musicArtistsRoute,
    musicGenresRoute,
    musicPlaylistsRoute,
    moviesRecommendedRoute,
    movieCollectionsRoute,
    movieGenresRoute,
    tvRecommendedRoute,
    tvShowsRoute,
    tvUpcomingRoute,
    tvGenresRoute,
    tvStudiosRoute,
    episodesRoute,
    livetvRoute,
    livetvChannelsRoute,
    livetvGuideRoute,
    livetvRecordingsRoute,
    livetvScheduleRoute,
    livetvSeriesTimersRoute,
    settingsRoute,
    userprofileRoute,
    searchRoute,
    quickconnectRoute,
    testRoute,
    loginRoute,
    selectServerRoute,
    forgotPasswordPinRoute,
    userDisplaySettingsRoute,
    userControlsSettingsRoute,
    userPlaybackSettingsRoute,
    userSubtitleSettingsRoute,
    userHomeSettingsRoute,
    lyricsRoute,
    metadataRoute,
    wizardStartRoute,
    wizardUserRoute,
    wizardLibraryRoute,
    wizardSettingsRoute,
    wizardRemoteRoute,
    wizardFinishRoute,
    dashboardRoute,
    ...(import.meta.env.DEV ? [devRoute] : [])
]);

export const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    history: createHashHistory()
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

export default router;
