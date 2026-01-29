import { createHashHistory, createRouter } from '@tanstack/react-router';
import { Route } from './routes/__root';
import { dashboardRoute } from './routes/dashboard';
import { detailsRoute } from './routes/details';
import { devRoute } from './routes/dev';
import { homeRoute } from './routes/home';
import { homeVideosRoute } from './routes/homevideos';
import { indexRoute } from './routes/index';
import { listRoute } from './routes/list';
import {
    livetvChannelsRoute,
    livetvGuideRoute,
    livetvRecordingsRoute,
    livetvRoute,
    livetvScheduleRoute,
    livetvSeriesTimersRoute
} from './routes/livetv';
import { lyricsRoute } from './routes/lyrics';
import { metadataRoute } from './routes/metadata';
import { movieCollectionsRoute, movieGenresRoute, moviesRecommendedRoute } from './routes/movies';
import {
    musicAlbumsRoute,
    musicArtistsRoute,
    musicGenresRoute,
    musicPlaylistsRoute,
    musicRecommendedRoute,
    musicSongsRoute
} from './routes/music';
import { nowplayingRoute } from './routes/nowplaying';
import { queueRoute } from './routes/queue';
import { forgotPasswordPinRoute, loginRoute, selectServerRoute, testRoute } from './routes/session';
import {
    episodesRoute,
    tvGenresRoute,
    tvRecommendedRoute,
    tvShowsRoute,
    tvStudiosRoute,
    tvUpcomingRoute
} from './routes/tv';
import { quickconnectRoute, searchRoute, settingsRoute, userprofileRoute } from './routes/user';
import {
    userControlsSettingsRoute,
    userDisplaySettingsRoute,
    userHomeSettingsRoute,
    userPlaybackSettingsRoute,
    userSubtitleSettingsRoute
} from './routes/userPreferences';
import { videoRoute } from './routes/video';
import {
    wizardFinishRoute,
    wizardLibraryRoute,
    wizardRemoteRoute,
    wizardSettingsRoute,
    wizardStartRoute,
    wizardUserRoute
} from './routes/wizard';

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
