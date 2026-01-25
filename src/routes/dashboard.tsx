import { lazy } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route } from './__root';

// Helper type for routes that export Component as named export
type NamedComponent = { Component: React.ComponentType };

// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardIndex = lazy(() =>
    import('../apps/dashboard/routes/index').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardActivity = lazy(() =>
    import('../apps/dashboard/routes/activity').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardBackups = lazy(() =>
    import('../apps/dashboard/routes/backups').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardBranding = lazy(() =>
    import('../apps/dashboard/routes/branding').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardDevices = lazy(() =>
    import('../apps/dashboard/routes/devices').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect expects default export but routes use named Component-error TanStack Router export
const DashboardSettings = lazy(() =>
    import('../apps/dashboard/routes/settings').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardKeys = lazy(() =>
    import('../apps/dashboard/routes/keys').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardLibraries = lazy(() =>
    import('../apps/dashboard/routes/libraries').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardLibrariesDisplay = lazy(() =>
    import('../apps/dashboard/routes/libraries/display').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardLibrariesMetadata = lazy(() =>
    import('../apps/dashboard/routes/libraries/metadata').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardLibrariesNfo = lazy(() =>
    import('../apps/dashboard/routes/libraries/nfo').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardLivetv = lazy(() =>
    import('../apps/dashboard/routes/livetv').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardLivetvRecordings = lazy(() =>
    import('../apps/dashboard/routes/livetv/recordings').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardLogs = lazy(() =>
    import('../apps/dashboard/routes/logs').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardLogsFile = lazy(() =>
    import('../apps/dashboard/routes/logs/file').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardPlaybackResume = lazy(() =>
    import('../apps/dashboard/routes/playback/resume').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardPlaybackStreaming = lazy(() =>
    import('../apps/dashboard/routes/playback/streaming').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardPlaybackTranscoding = lazy(() =>
    import('../apps/dashboard/routes/playback/transcoding').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardPlaybackTrickplay = lazy(() =>
    import('../apps/dashboard/routes/playback/trickplay').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardPlugins = lazy(() =>
    import('../apps/dashboard/routes/plugins').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardPluginsPlugin = lazy(() =>
    import('../apps/dashboard/routes/plugins/plugin').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardPluginsRepositories = lazy(() =>
    import('../apps/dashboard/routes/plugins/repositories').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardTasks = lazy(() =>
    import('../apps/dashboard/routes/tasks').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardTasksTask = lazy(() =>
    import('../apps/dashboard/routes/tasks/task').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardUsers = lazy(() =>
    import('../apps/dashboard/routes/users').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardUsersAccess = lazy(() =>
    import('../apps/dashboard/routes/users/access').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardUsersAdd = lazy(() =>
    import('../apps/dashboard/routes/users/add').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardUsersParentalControl = lazy(() =>
    import('../apps/dashboard/routes/users/parentalcontrol').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardUsersPassword = lazy(() =>
    import('../apps/dashboard/routes/users/password').then(m => ({ default: (m as NamedComponent).Component }))
);
// @ts-expect-error TanStack Router expects default export but routes use named Component export
const DashboardUsersProfile = lazy(() =>
    import('../apps/dashboard/routes/users/profile').then(m => ({ default: (m as NamedComponent).Component }))
);

export const dashboardRoute = createRoute({
    getParentRoute: () => Route,
    path: 'dashboard',
    // @ts-expect-error AppLayout exports default
    component: lazy(() => import('../apps/dashboard/AppLayout').then(m => ({ default: m.default }))),
    children: [
        {
            index: true,
            component: DashboardIndex
        },
        {
            path: 'activity',
            component: DashboardActivity
        },
        {
            path: 'backups',
            component: DashboardBackups
        },
        {
            path: 'branding',
            component: DashboardBranding
        },
        {
            path: 'devices',
            component: DashboardDevices
        },
        {
            path: 'settings',
            component: DashboardSettings
        },
        {
            path: 'keys',
            component: DashboardKeys
        },
        {
            path: 'libraries',
            component: DashboardLibraries
        },
        {
            path: 'libraries/display',
            component: DashboardLibrariesDisplay
        },
        {
            path: 'libraries/metadata',
            component: DashboardLibrariesMetadata
        },
        {
            path: 'libraries/nfo',
            component: DashboardLibrariesNfo
        },
        {
            path: 'livetv',
            component: DashboardLivetv
        },
        {
            path: 'livetv/recordings',
            component: DashboardLivetvRecordings
        },
        {
            path: 'logs',
            component: DashboardLogs
        },
        {
            path: 'logs/:file',
            component: DashboardLogsFile
        },
        {
            path: 'playback/resume',
            component: DashboardPlaybackResume
        },
        {
            path: 'playback/streaming',
            component: DashboardPlaybackStreaming
        },
        {
            path: 'playback/transcoding',
            component: DashboardPlaybackTranscoding
        },
        {
            path: 'playback/trickplay',
            component: DashboardPlaybackTrickplay
        },
        {
            path: 'plugins',
            component: DashboardPlugins
        },
        {
            path: 'plugins/:pluginId',
            component: DashboardPluginsPlugin
        },
        {
            path: 'plugins/repositories',
            component: DashboardPluginsRepositories
        },
        {
            path: 'tasks',
            component: DashboardTasks
        },
        {
            path: 'tasks/:id',
            component: DashboardTasksTask
        },
        {
            path: 'users',
            component: DashboardUsers
        },
        {
            path: 'users/access',
            component: DashboardUsersAccess
        },
        {
            path: 'users/add',
            component: DashboardUsersAdd
        },
        {
            path: 'users/parentalcontrol',
            component: DashboardUsersParentalControl
        },
        {
            path: 'users/password',
            component: DashboardUsersPassword
        },
        {
            path: 'users/profile',
            component: DashboardUsersProfile
        }
    ]
});
