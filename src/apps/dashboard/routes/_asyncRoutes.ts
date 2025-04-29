import type { AsyncRoute } from 'components/router/AsyncRoute';
import { AppType } from 'constants/appType';

export const ASYNC_ADMIN_ROUTES: AsyncRoute[] = [
    { path: 'activity', type: AppType.Dashboard },
    { path: 'branding', type: AppType.Dashboard },
    { path: 'devices', type: AppType.Dashboard },
    { path: 'settings', type: AppType.Dashboard },
    { path: 'keys', type: AppType.Dashboard },
    { path: 'libraries/display', type: AppType.Dashboard },
    { path: 'libraries/metadata', type: AppType.Dashboard },
    { path: 'libraries/nfo', type: AppType.Dashboard },
    { path: 'logs', type: AppType.Dashboard },
    { path: 'logs/:file', page: 'logs/file', type: AppType.Dashboard },
    { path: 'playback/resume', type: AppType.Dashboard },
    { path: 'playback/streaming', type: AppType.Dashboard },
    { path: 'playback/trickplay', type: AppType.Dashboard },
    { path: 'plugins/:pluginId', page: 'plugins/plugin', type: AppType.Dashboard },
    { path: 'tasks', type: AppType.Dashboard },
    { path: 'tasks/:id', page: 'tasks/task', type: AppType.Dashboard },
    { path: 'users', type: AppType.Dashboard },
    { path: 'users/access', type: AppType.Dashboard },
    { path: 'users/add', type: AppType.Dashboard },
    { path: 'users/parentalcontrol', type: AppType.Dashboard },
    { path: 'users/password', type: AppType.Dashboard },
    { path: 'users/profile', type: AppType.Dashboard }
];
