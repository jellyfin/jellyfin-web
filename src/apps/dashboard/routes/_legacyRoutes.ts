import type { LegacyRoute } from 'components/router/LegacyRoute';
import { AppType } from 'constants/appType';

export const LEGACY_ADMIN_ROUTES: LegacyRoute[] = [
    {
        path: '/dashboard',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/dashboard',
            view: 'dashboard/dashboard.html'
        }
    }, {
        path: 'settings',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/general',
            view: 'dashboard/general.html'
        }
    }, {
        path: 'networking',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/networking',
            view: 'dashboard/networking.html'
        }
    }, {
        path: 'devices',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/devices/devices',
            view: 'dashboard/devices/devices.html'
        }
    }, {
        path: 'devices/edit',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/devices/device',
            view: 'dashboard/devices/device.html'
        }
    }, {
        path: 'libraries',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/library',
            view: 'dashboard/library.html'
        }
    }, {
        path: 'libraries/display',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/librarydisplay',
            view: 'dashboard/librarydisplay.html'
        }
    }, {
        path: 'playback/transcoding',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/encodingsettings',
            view: 'dashboard/encodingsettings.html'
        }
    }, {
        path: 'libraries/metadata',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/metadataImages',
            view: 'dashboard/metadataimages.html'
        }
    }, {
        path: 'libraries/nfo',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/metadatanfo',
            view: 'dashboard/metadatanfo.html'
        }
    }, {
        path: 'playback/resume',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/playback',
            view: 'dashboard/playback.html'
        }
    }, {
        path: 'plugins/catalog',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/plugins/available/index',
            view: 'dashboard/plugins/available/index.html'
        }
    }, {
        path: 'plugins/repositories',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/plugins/repositories/index',
            view: 'dashboard/plugins/repositories/index.html'
        }
    }, {
        path: 'livetv/guide',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'livetvguideprovider',
            view: 'livetvguideprovider.html'
        }
    }, {
        path: 'recordings',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'livetvsettings',
            view: 'livetvsettings.html'
        }
    }, {
        path: 'livetv',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'livetvstatus',
            view: 'livetvstatus.html'
        }
    }, {
        path: 'livetv/tuner',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'livetvtuner',
            view: 'livetvtuner.html'
        }
    }, {
        path: 'plugins',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/plugins/installed/index',
            view: 'dashboard/plugins/installed/index.html'
        }
    }, {
        path: 'tasks/edit',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/scheduledtasks/scheduledtask',
            view: 'dashboard/scheduledtasks/scheduledtask.html'
        }
    }, {
        path: 'tasks',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard/scheduledtasks/scheduledtasks',
            view: 'dashboard/scheduledtasks/scheduledtasks.html'
        }
    }, {
        path: 'playback/streaming',
        pageProps: {
            appType: AppType.Dashboard,
            view: 'dashboard/streaming.html',
            controller: 'dashboard/streaming'
        }
    }
];
