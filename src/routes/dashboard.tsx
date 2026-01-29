import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { Route } from './__root';

export const dashboardRoute = createRoute({
    getParentRoute: () => Route,
    path: 'dashboard',
    component: lazyRouteComponent(() => import('../apps/dashboard/AppLayout'))
});

const dashboardIndexRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: '/',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/index'))
});

const dashboardActivityRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'activity',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/activity'))
});

const dashboardBackupsRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'backups',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/backups'))
});

const dashboardBrandingRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'branding',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/branding'))
});

const dashboardDevicesRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'devices',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/devices'))
});

const dashboardSettingsRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'settings',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/settings'))
});

const dashboardKeysRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'keys',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/keys'))
});

const dashboardLibrariesRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'libraries',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/libraries'))
});

const dashboardLibrariesDisplayRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'libraries/display',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/libraries/display'))
});

const dashboardLibrariesMetadataRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'libraries/metadata',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/libraries/metadata'))
});

const dashboardLibrariesNfoRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'libraries/nfo',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/libraries/nfo'))
});

const dashboardLivetvRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'livetv',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/livetv'))
});

const dashboardLivetvRecordingsRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'livetv/recordings',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/livetv/recordings'))
});

const dashboardLogsRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'logs',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/logs'))
});

const dashboardLogsFileRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'logs/$file',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/logs/file'))
});

const dashboardPlaybackResumeRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'playback/resume',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/playback/resume'))
});

const dashboardPlaybackStreamingRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'playback/streaming',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/playback/streaming'))
});

const dashboardPlaybackTranscodingRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'playback/transcoding',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/playback/transcoding'))
});

const dashboardPlaybackTrickplayRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'playback/trickplay',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/playback/trickplay'))
});

const dashboardPluginsRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'plugins',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/plugins'))
});

const dashboardPluginsPluginRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'plugins/$pluginId',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/plugins/plugin'))
});

const dashboardPluginsRepositoriesRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'plugins/repositories',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/plugins/repositories'))
});

const dashboardTasksRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'tasks',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/tasks'))
});

const dashboardTasksTaskRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'tasks/$id',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/tasks/task'))
});

const dashboardUsersRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'users',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/users'))
});

const dashboardUsersAccessRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'users/access',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/users/access'))
});

const dashboardUsersAddRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'users/add',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/users/add'))
});

const dashboardUsersParentalControlRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'users/parentalcontrol',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/users/parentalcontrol'))
});

const dashboardUsersPasswordRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'users/password',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/users/password'))
});

const dashboardUsersProfileRoute = createRoute({
    getParentRoute: () => dashboardRoute,
    path: 'users/profile',
    component: lazyRouteComponent(() => import('../apps/dashboard/routes/users/profile'))
});

dashboardRoute.addChildren([
    dashboardIndexRoute,
    dashboardActivityRoute,
    dashboardBackupsRoute,
    dashboardBrandingRoute,
    dashboardDevicesRoute,
    dashboardSettingsRoute,
    dashboardKeysRoute,
    dashboardLibrariesRoute,
    dashboardLibrariesDisplayRoute,
    dashboardLibrariesMetadataRoute,
    dashboardLibrariesNfoRoute,
    dashboardLivetvRoute,
    dashboardLivetvRecordingsRoute,
    dashboardLogsRoute,
    dashboardLogsFileRoute,
    dashboardPlaybackResumeRoute,
    dashboardPlaybackStreamingRoute,
    dashboardPlaybackTranscodingRoute,
    dashboardPlaybackTrickplayRoute,
    dashboardPluginsRoute,
    dashboardPluginsPluginRoute,
    dashboardPluginsRepositoriesRoute,
    dashboardTasksRoute,
    dashboardTasksTaskRoute,
    dashboardUsersRoute,
    dashboardUsersAccessRoute,
    dashboardUsersAddRoute,
    dashboardUsersParentalControlRoute,
    dashboardUsersPasswordRoute,
    dashboardUsersProfileRoute
]);
