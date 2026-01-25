import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { Route } from './__root';

export const userDisplaySettingsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'mypreferencesdisplay',
    component: lazyRouteComponent(() => import('apps/stable/routes/user/display'), 'default')
});

export const userControlsSettingsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'mypreferencescontrols',
    component: lazyRouteComponent(() => import('apps/stable/routes/user/controls/UserControlsSettings'), 'default')
});

export const userPlaybackSettingsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'mypreferencesplayback',
    component: lazyRouteComponent(() => import('apps/stable/routes/user/playback/PlaybackSettings'), 'default')
});

export const userSubtitleSettingsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'mypreferencessubtitles',
    component: lazyRouteComponent(() => import('apps/stable/routes/user/subtitles/SubtitleSettings'), 'default')
});

export const userHomeSettingsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'mypreferenceshome',
    component: lazyRouteComponent(() => import('apps/stable/routes/user/home'), 'default')
});
