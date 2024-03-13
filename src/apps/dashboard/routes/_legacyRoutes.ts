import type { LegacyRoute } from 'components/router/LegacyRoute';

export const LEGACY_ADMIN_ROUTES: LegacyRoute[] = [
    {
        path: '/dashboard',
        pageProps: {
            controller: 'dashboard/dashboard',
            view: 'dashboard/dashboard.html'
        }
    }, {
        path: 'settings',
        pageProps: {
            controller: 'dashboard/general',
            view: 'dashboard/general.html'
        }
    }, {
        path: 'networking',
        pageProps: {
            controller: 'dashboard/networking',
            view: 'dashboard/networking.html'
        }
    }, {
        path: 'devices',
        pageProps: {
            controller: 'dashboard/devices/devices',
            view: 'dashboard/devices/devices.html'
        }
    }, {
        path: 'devices/edit',
        pageProps: {
            controller: 'dashboard/devices/device',
            view: 'dashboard/devices/device.html'
        }
    }, {
        path: 'plugins/add',
        pageProps: {
            controller: 'dashboard/plugins/add/index',
            view: 'dashboard/plugins/add/index.html'
        }
    }, {
        path: 'libraries',
        pageProps: {
            controller: 'dashboard/library',
            view: 'dashboard/library.html'
        }
    }, {
        path: 'libraries/display',
        pageProps: {
            controller: 'dashboard/librarydisplay',
            view: 'dashboard/librarydisplay.html'
        }
    }, {
        path: 'playback/transcoding',
        pageProps: {
            controller: 'dashboard/encodingsettings',
            view: 'dashboard/encodingsettings.html'
        }
    }, {
        path: 'logs',
        pageProps: {
            controller: 'dashboard/logs',
            view: 'dashboard/logs.html'
        }
    }, {
        path: 'libraries/metadata',
        pageProps: {
            controller: 'dashboard/metadataImages',
            view: 'dashboard/metadataimages.html'
        }
    }, {
        path: 'libraries/nfo',
        pageProps: {
            controller: 'dashboard/metadatanfo',
            view: 'dashboard/metadatanfo.html'
        }
    }, {
        path: 'playback/resume',
        pageProps: {
            controller: 'dashboard/playback',
            view: 'dashboard/playback.html'
        }
    }, {
        path: 'plugins/catalog',
        pageProps: {
            controller: 'dashboard/plugins/available/index',
            view: 'dashboard/plugins/available/index.html'
        }
    }, {
        path: 'plugins/repositories',
        pageProps: {
            controller: 'dashboard/plugins/repositories/index',
            view: 'dashboard/plugins/repositories/index.html'
        }
    }, {
        path: 'livetv/guide',
        pageProps: {
            controller: 'livetvguideprovider',
            view: 'livetvguideprovider.html'
        }
    }, {
        path: 'recordings',
        pageProps: {
            controller: 'livetvsettings',
            view: 'livetvsettings.html'
        }
    }, {
        path: 'livetv',
        pageProps: {
            controller: 'livetvstatus',
            view: 'livetvstatus.html'
        }
    }, {
        path: 'livetv/tuner',
        pageProps: {
            controller: 'livetvtuner',
            view: 'livetvtuner.html'
        }
    }, {
        path: 'plugins',
        pageProps: {
            controller: 'dashboard/plugins/installed/index',
            view: 'dashboard/plugins/installed/index.html'
        }
    }, {
        path: 'tasks/edit',
        pageProps: {
            controller: 'dashboard/scheduledtasks/scheduledtask',
            view: 'dashboard/scheduledtasks/scheduledtask.html'
        }
    }, {
        path: 'tasks',
        pageProps: {
            controller: 'dashboard/scheduledtasks/scheduledtasks',
            view: 'dashboard/scheduledtasks/scheduledtasks.html'
        }
    }, {
        path: 'keys',
        pageProps: {
            controller: 'dashboard/apikeys',
            view: 'dashboard/apikeys.html'
        }
    }, {
        path: 'playback/streaming',
        pageProps: {
            view: 'dashboard/streaming.html',
            controller: 'dashboard/streaming'
        }
    }
];
