import type { LegacyRoute } from 'components/router/LegacyRoute';
import { AppType } from 'constants/appType';

export const LEGACY_ADMIN_ROUTES: LegacyRoute[] = [
    {
        path: '/dashboard',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'dashboard',
            view: 'dashboard.html'
        }
    }, {
        path: 'networking',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'networking',
            view: 'networking.html'
        }
    }, {
        path: 'libraries',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'library',
            view: 'library.html'
        }
    }, {
        path: 'playback/transcoding',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'encodingsettings',
            view: 'encodingsettings.html'
        }
    }, {
        path: 'plugins/catalog',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'plugins/available/index',
            view: 'plugins/available/index.html'
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
            controller: 'plugins/installed/index',
            view: 'plugins/installed/index.html'
        }
    }
];
