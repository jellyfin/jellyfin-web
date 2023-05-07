import { LegacyRoute } from '../../../../components/router/LegacyRoute';

export const LEGACY_ADMIN_ROUTES: LegacyRoute[] = [
    {
        path: 'dashboard.html',
        pageProps: {
            controller: 'dashboard/dashboard',
            view: 'dashboard/dashboard.html'
        }
    }, {
        path: 'dashboardgeneral.html',
        pageProps: {
            controller: 'dashboard/general',
            view: 'dashboard/general.html'
        }
    }, {
        path: 'networking.html',
        pageProps: {
            controller: 'dashboard/networking',
            view: 'dashboard/networking.html'
        }
    }, {
        path: 'devices.html',
        pageProps: {
            controller: 'dashboard/devices/devices',
            view: 'dashboard/devices/devices.html'
        }
    }, {
        path: 'device.html',
        pageProps: {
            controller: 'dashboard/devices/device',
            view: 'dashboard/devices/device.html'
        }
    }, {
        path: 'quickConnect.html',
        pageProps: {
            controller: 'dashboard/quickConnect',
            view: 'dashboard/quickConnect.html'
        }
    }, {
        path: 'dlnaprofile.html',
        pageProps: {
            controller: 'dashboard/dlna/profile',
            view: 'dashboard/dlna/profile.html'
        }
    }, {
        path: 'dlnaprofiles.html',
        pageProps: {
            controller: 'dashboard/dlna/profiles',
            view: 'dashboard/dlna/profiles.html'
        }
    }, {
        path: 'dlnasettings.html',
        pageProps: {
            controller: 'dashboard/dlna/settings',
            view: 'dashboard/dlna/settings.html'
        }
    }, {
        path: 'addplugin.html',
        pageProps: {
            controller: 'dashboard/plugins/add/index',
            view: 'dashboard/plugins/add/index.html'
        }
    }, {
        path: 'library.html',
        pageProps: {
            controller: 'dashboard/library',
            view: 'dashboard/library.html'
        }
    }, {
        path: 'librarydisplay.html',
        pageProps: {
            controller: 'dashboard/librarydisplay',
            view: 'dashboard/librarydisplay.html'
        }
    }, {
        path: 'edititemmetadata.html',
        pageProps: {
            controller: 'edititemmetadata',
            view: 'edititemmetadata.html'
        }
    }, {
        path: 'encodingsettings.html',
        pageProps: {
            controller: 'dashboard/encodingsettings',
            view: 'dashboard/encodingsettings.html'
        }
    }, {
        path: 'log.html',
        pageProps: {
            controller: 'dashboard/logs',
            view: 'dashboard/logs.html'
        }
    }, {
        path: 'metadataimages.html',
        pageProps: {
            controller: 'dashboard/metadataImages',
            view: 'dashboard/metadataimages.html'
        }
    }, {
        path: 'metadatanfo.html',
        pageProps: {
            controller: 'dashboard/metadatanfo',
            view: 'dashboard/metadatanfo.html'
        }
    }, {
        path: 'notificationsetting.html',
        pageProps: {
            controller: 'dashboard/notifications/notification/index',
            view: 'dashboard/notifications/notification/index.html'
        }
    }, {
        path: 'notificationsettings.html',
        pageProps: {
            controller: 'dashboard/notifications/notifications/index',
            view: 'dashboard/notifications/notifications/index.html'
        }
    }, {
        path: 'playbackconfiguration.html',
        pageProps: {
            controller: 'dashboard/playback',
            view: 'dashboard/playback.html'
        }
    }, {
        path: 'availableplugins.html',
        pageProps: {
            controller: 'dashboard/plugins/available/index',
            view: 'dashboard/plugins/available/index.html'
        }
    }, {
        path: 'repositories.html',
        pageProps: {
            controller: 'dashboard/plugins/repositories/index',
            view: 'dashboard/plugins/repositories/index.html'
        }
    }, {
        path: 'livetvguideprovider.html',
        pageProps: {
            controller: 'livetvguideprovider',
            view: 'livetvguideprovider.html'
        }
    }, {
        path: 'livetvsettings.html',
        pageProps: {
            controller: 'livetvsettings',
            view: 'livetvsettings.html'
        }
    }, {
        path: 'livetvstatus.html',
        pageProps: {
            controller: 'livetvstatus',
            view: 'livetvstatus.html'
        }
    }, {
        path: 'livetvtuner.html',
        pageProps: {
            controller: 'livetvtuner',
            view: 'livetvtuner.html'
        }
    }, {
        path: 'installedplugins.html',
        pageProps: {
            controller: 'dashboard/plugins/installed/index',
            view: 'dashboard/plugins/installed/index.html'
        }
    }, {
        path: 'scheduledtask.html',
        pageProps: {
            controller: 'dashboard/scheduledtasks/scheduledtask',
            view: 'dashboard/scheduledtasks/scheduledtask.html'
        }
    }, {
        path: 'scheduledtasks.html',
        pageProps: {
            controller: 'dashboard/scheduledtasks/scheduledtasks',
            view: 'dashboard/scheduledtasks/scheduledtasks.html'
        }
    }, {
        path: 'serveractivity.html',
        pageProps: {
            controller: 'dashboard/serveractivity',
            view: 'dashboard/serveractivity.html'
        }
    }, {
        path: 'apikeys.html',
        pageProps: {
            controller: 'dashboard/apikeys',
            view: 'dashboard/apikeys.html'
        }
    }, {
        path: 'streamingsettings.html',
        pageProps: {
            view: 'dashboard/streaming.html',
            controller: 'dashboard/streaming'
        }
    }
];
