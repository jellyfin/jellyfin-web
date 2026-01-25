import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { Route } from './__root';

export const livetvRoute = createRoute({
    getParentRoute: () => Route,
    path: 'livetv',
    component: lazyRouteComponent(() => import('./livetv.lazy'), 'LiveTVPage')
});

export const livetvChannelsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'livetvchannels',
    component: lazyRouteComponent(() => import('./livetv.lazy'), 'LiveTVChannelsPage')
});

export const livetvGuideRoute = createRoute({
    getParentRoute: () => Route,
    path: 'livetvguide',
    component: lazyRouteComponent(() => import('./livetv.lazy'), 'LiveTVGuidePage')
});

export const livetvRecordingsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'livetvrecordings',
    component: lazyRouteComponent(() => import('./livetv.lazy'), 'LiveTVRecordingsPage')
});

export const livetvScheduleRoute = createRoute({
    getParentRoute: () => Route,
    path: 'livetvschedule',
    component: lazyRouteComponent(() => import('./livetv.lazy'), 'LiveTVSchedulePage')
});

export const livetvSeriesTimersRoute = createRoute({
    getParentRoute: () => Route,
    path: 'livetvseriestimers',
    component: lazyRouteComponent(() => import('./livetv.lazy'), 'LiveTVSeriesTimersPage')
});
